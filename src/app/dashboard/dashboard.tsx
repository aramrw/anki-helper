"use client"

import React, { useEffect, useState } from 'react'
import SideLeft from './_components/side-left/side-left'
import { invoke } from '@tauri-apps/api/core';
import Editor from './_components/editor/editor';

export interface Note {
    id: string;
    title: string;
    workspace_id: string;
    save_data: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    current_workspace: string
    current_note: string
    created_at: string;
    updated_at: string;
}

interface Workspace {
    title: string;
    id: number;
    createdAt: string;
    updatedAt: string;
}

export default function Dashboard() {
    const [currentNote, setCurrentNote] = useState<Note>();
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>();
    const useSetCurrentNoteHook = (currentNote: Note) => {
        setCurrentNote(currentNote)
    }


    useEffect(() => {
        invoke("get_user").then((res) => {
            let user: User[] = JSON.parse(res as string)
            //console.log(user[0])
            if (user && user[0].current_note !== "none")
                invoke("get_note_by_title", { currentNote: user[0].current_note }).then((res) => {
                    let note: Note = JSON.parse(res as string);
                    //console.log(note)
                    setCurrentNote(note);
                }).catch((e) => {
                    console.log(e);
                }).finally(() => {
                    invoke("get_workspace_by_title", { currentWorkspace: user[0].current_workspace }).
                        then((res) => {
                            //console.log(res)
                            let json: Workspace = JSON.parse(res as string);
                            setCurrentWorkspace(json)
                        })
                })
        })
    }, []);

    return (
        <main className='flex h-screen w-full flex-row'>
            <SideLeft setCurrentNote={useSetCurrentNoteHook} currentNote={currentNote?.title} />
            {currentNote && (
                <Editor currentNote={currentNote} workspaceId={currentWorkspace?.id.toString()} setCurrentNote={useSetCurrentNoteHook} />
            )}
        </main>
    )
}
