// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{future::IntoFuture, vec};

use serde_json::to_string_pretty;
use tauri::generate_handler;
use tokio::sync::Mutex;

use serde::{Deserialize, Serialize, Serializer};
use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};
#[allow(warnings, unused)]
use tauri::{command, AppHandle, Manager};
use uuid::Uuid;

#[derive(Deserialize, Debug)]
struct DatabaseErrors {
    message: String,
}

impl Serialize for DatabaseErrors {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.message)
    }
}

// ** DB Models ** //
#[derive(Serialize, Deserialize)]
struct Workspace {
    id: String,
    title: String,
    created_at: String,
    updated_at: String,
    //user_id: String,
    //user: User, // you can't row.get() a struct.
}

#[derive(Serialize, Deserialize)]
struct Note {
    id: String,
    title: String,
    save_data: String,
    created_at: String,
    updated_at: String,
    workspace_id: String,
}

#[derive(Serialize, Deserialize)]
struct User {
    id: String,
    current_workspace: Option<String>,
    current_note: Option<String>,
    created_at: String,
    updated_at: String,
}
// ** DB Models ** //

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let appdata_dir = app.path().app_data_dir().unwrap();
            if !appdata_dir.exists() {
                std::fs::create_dir(&appdata_dir).unwrap();
            }
            // println!("{}", &appdata_dir.to_string_lossy());
            create_database(
                appdata_dir
                    .join("main.db")
                    .to_str()
                    .expect("FATAL: Could not create database!"),
                handle.clone(),
            );
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(generate_handler![
            get_user,
            create_workspace,
            get_workspaces,
            get_workspace_by_title,
            update_user_workspace,
            update_user_note,
            create_note,
            get_notes,
            get_note_by_title,
            save_notes,
            get_note_save_data,
            delete_note,
            rename_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ** DB Functions/Commands ** //
// workspaces

#[command]
async fn create_workspace(workspace_title: &str, handle: AppHandle) -> Result<(), DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let uuid = Uuid::new_v4().to_string();
    //let now = chrono::Utc::now();

    sqlx::query("INSERT INTO workspace (id, title, createdAt, updatedAt) VALUES (?, ?, datetime('now'), datetime('now'))")
        .bind(uuid)
        .bind(workspace_title)
        .execute(&*pool).await.unwrap();
    Ok(())
}

#[command]
async fn get_workspaces(handle: AppHandle) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let result = sqlx::query("SELECT * FROM workspace")
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut workspaces: Vec<Workspace> = Vec::new();
    result.iter().for_each(|row| {
        workspaces.push(Workspace {
            id: row.get(0),
            title: row.get(1),
            created_at: row.get(2),
            updated_at: row.get(3),
        });
    });

    let json_result = to_string_pretty(&workspaces).unwrap();

    Ok(json_result)
}

#[command]
async fn update_user_workspace(
    workspace_title: &str,
    handle: AppHandle,
) -> Result<(), DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    sqlx::query("UPDATE user SET currentWorkspace = ?, updatedAt = datetime('now')")
        .bind(workspace_title)
        .execute(&*pool)
        .await
        .unwrap();

    Ok(())
}

#[command]
async fn get_workspace_by_title(
    handle: AppHandle,
    current_workspace: &str,
) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let result = sqlx::query("SELECT * FROM workspace WHERE title = ?")
        .bind(current_workspace)
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut workspaces: Vec<Workspace> = Vec::new();
    result.iter().for_each(|row| {
        workspaces.push(Workspace {
            id: row.get(0),
            title: row.get(1),
            created_at: row.get(2),
            updated_at: row.get(3),
        })
    });

    let json_result = to_string_pretty(&workspaces[0]).unwrap();

    Ok(json_result)
}

// notes
#[command]
async fn create_note(
    handle: AppHandle,
    title: &str,
    workspace_id: &str,
) -> Result<(), DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO note (id, title, createdAt, updatedAt, workspaceId) VALUES (?, ?, datetime('now'), datetime('now'), ?)")
    .bind(id)
    .bind(title)
    .bind(workspace_id)
    .execute(&*pool).await.unwrap();

    Ok(())
}

#[command]
async fn get_notes(handle: AppHandle, workspace_id: &str) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let result = sqlx::query("SELECT * FROM note WHERE workspaceId = ?")
        .bind(workspace_id)
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut notes: Vec<Note> = Vec::new();
    result.iter().for_each(|row| {
        notes.push(Note {
            id: row.get(0),
            title: row.get(1),
            workspace_id: row.get(2),
            save_data: row.get(3),
            created_at: row.get(4),
            updated_at: row.get(5),
        })
    });

    let json_result = to_string_pretty(&notes).unwrap();

    Ok(json_result)
}

#[command]
async fn get_note_by_title(
    handle: AppHandle,
    current_note: &str,
) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let result = sqlx::query("SELECT * FROM note WHERE title = ?")
        .bind(current_note)
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut notes: Vec<Note> = Vec::new();
    result.iter().for_each(|row| {
        notes.push(Note {
            id: row.get(0),
            title: row.get(1),
            save_data: row.get(2),
            created_at: row.get(3),
            updated_at: row.get(4),
            workspace_id: row.get(5),
        })
    });

    let json_result = to_string_pretty(&notes[0]).unwrap();

    Ok(json_result)
}

#[command]
async fn update_user_note(handle: AppHandle, title: &str) -> Result<(), DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    sqlx::query("UPDATE user SET currentNote = ?, updatedAt = datetime('now')")
        .bind(title)
        .execute(&*pool)
        .await
        .unwrap();

    Ok(())
}

#[command]
async fn get_note_save_data(handle: AppHandle, id: &str) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let row = sqlx::query("SELECT * FROM note WHERE id = ?")
        .bind(id)
        .fetch_one(&*pool)
        .await
        .unwrap();

    let note = Note {
        id: row.get(0),
        title: row.get(1),
        workspace_id: row.get(2),
        save_data: row.get(3),
        created_at: row.get(4),
        updated_at: row.get(5),
    };

    let json_result = to_string_pretty(&note).unwrap();

    Ok(json_result)
}

#[command]
async fn save_notes(
    handle: AppHandle,
    data: &str,
    current_note_id: &str,
) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    // let json_data = to_string_pretty(&data).unwrap();

    //println!("Saving: {} to ID: {}", data, current_note_id);

    sqlx::query("UPDATE note SET saveData = ?, updatedAt = datetime('now') WHERE id = ?")
        .bind(&data)
        .bind(current_note_id)
        .execute(&*pool)
        .await
        .unwrap();

    Ok(data.to_string())
}

#[command]
async fn delete_note(handle: AppHandle, current_note_id: String) {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    sqlx::query("DELETE FROM note WHERE id = ?")
        .bind(current_note_id)
        .execute(&*pool)
        .await
        .unwrap();
}

#[command]
async fn rename_note(handle: AppHandle, current_note_id: String, new_title: String) {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>();
    let pool = pool_mutex.lock().await;

    sqlx::query("UPDATE note SET title = ?, updatedAt = datetime('now') WHERE id = ?")
        .bind(&new_title)
        .bind(&current_note_id)
        .execute(&*pool)
        .await
        .unwrap();
}

// user
#[command]
async fn get_user(handle: AppHandle) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let result = sqlx::query("SELECT * FROM user ")
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut users: Vec<User> = Vec::new();

    result.iter().for_each(|row| {
        users.push(User {
            id: row.get(0),
            current_workspace: row.get(1),
            current_note: row.get(2),
            created_at: row.get(3),
            updated_at: row.get(4),
        })
    });

    let json_result = to_string_pretty(&users).unwrap();

    Ok(json_result)
}

// ! IMPORTANT: DO NOT REMOVE/EDIT THESE FUNCTIONS
fn create_database(path: &str, handle: AppHandle) {
    tokio::task::block_in_place(move || {
        tauri::async_runtime::block_on(async move {
            if !Sqlite::database_exists(&path).await.unwrap_or(false) {
                Sqlite::create_database(&path).await?;
            }

            let sqlite_pool = SqlitePool::connect(&path).await?;
            let pool = sqlite_pool.clone();
            handle.manage(Mutex::new(sqlite_pool));

            //sqlx::migrate!("prisma/migrations").run(&pool).await?;

            // ** handle all migrations by hand because I'm an idiot **

            sqlx::query("CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY UNIQUE, currentWorkspace TEXT, currentNote TEXT, createdAt TEXT, updatedAt TEXT)")
            .execute(&pool).await.unwrap();

            sqlx::query("CREATE TABLE IF NOT EXISTS workspace (id TEXT PRIMARY KEY UNIQUE, title TEXT, createdAt TEXT, updatedAt TEXT)")
            .execute(&pool).await.unwrap();

            sqlx::query("CREATE TABLE IF NOT EXISTS note (id TEXT PRIMARY KEY UNIQUE, title TEXT, workspaceId TEXT, saveData, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (workspaceId) REFERENCES workspace(id))")
            .execute(&pool).await.unwrap();

            create_user_if_null(handle).await.unwrap();

            Ok::<(), sqlx::Error>(())
        })
    })
    .unwrap();
}

async fn create_user_if_null(handle: AppHandle) -> Result<String, DatabaseErrors> {
    let pool_mutex = handle.state::<Mutex<SqlitePool>>().clone();
    let pool = pool_mutex.lock().into_future().await;

    let id = Uuid::new_v4().to_string();

    // there will only ever be one user ..// unless I get bored and add more..
    let result = sqlx::query("SELECT * FROM user")
        .fetch_all(&*pool)
        .await
        .unwrap();

    let mut users: Vec<User> = Vec::new();
    result.iter().for_each(|row| {
        users.push(User {
            id: row.get(0),
            current_workspace: row.get(1),
            current_note: row.get(2),
            created_at: row.get(3),
            updated_at: row.get(4),
        })
    });

    if users.is_empty() {
        sqlx::query("INSERT INTO user (id, createdAt, updatedAt, currentWorkspace, currentNote) VALUES (?, datetime('now'), datetime('now'), ?, ?)")
        .bind(&id)
        .bind("none")
        .bind("none")
       .execute(&*pool).await.unwrap();

        let result = sqlx::query("SELECT * FROM user")
            .fetch_all(&*pool)
            .await
            .unwrap();

        result.iter().for_each(|row| {
            users.push(User {
                id: row.get(0),
                current_workspace: row.get(1),
                current_note: row.get(2),
                created_at: row.get(3),
                updated_at: row.get(4),
            })
        });

        let json_result = to_string_pretty(&users).unwrap();

        Ok(json_result)
    } else {
        let json_result = to_string_pretty(&users).unwrap();
        Ok(json_result)
    }
}
