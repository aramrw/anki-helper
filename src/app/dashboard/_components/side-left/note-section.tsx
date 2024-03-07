"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Frown, Plus } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Note } from '../../dashboard';
import { cn } from '@/lib/utils';
//import { cn } from '@/lib/utils';

export default function NoteSection({ currentWorkspace, currentNote, setCurrentNote }: { currentNote: string | undefined, currentWorkspace: string, setCurrentNote: (value: Note) => void }) {
  const [currentWorkspaceObject, setCurrentWorkspaceObject] = useState<any>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [showInputBox, setShowInputBox] = useState<boolean>(false);
  const inputElementRef = useRef<HTMLInputElement>(null);

  const getWorkspaceByTitle = useCallback(() => {
    console.log(currentWorkspace)
    if (currentWorkspace === "none" || currentWorkspace === "") return;
    invoke("get_workspace_by_title", { currentWorkspace: currentWorkspace }).then((res) => {
      //console.log(res);
      let parsed = JSON.parse(res as string)
      setCurrentWorkspaceObject(parsed);
    }).catch((e) => {
      console.log(e);
    })
  }, [currentWorkspace]);

  const getNotes = useCallback(() => {
    if (currentWorkspace !== "")
      invoke("get_notes", { workspaceId: currentWorkspaceObject.id }).then((res) => {
        const parsedNotes = JSON.parse(res as string);
        //console.log(parsedNotes)
        setNotes(parsedNotes)
      }).catch((e) => {
        console.log(e);
      })
  }, [currentWorkspaceObject, currentNote]);

  useEffect(() => {
    getWorkspaceByTitle();
  }, [getWorkspaceByTitle]);

  useEffect(() => {
    getNotes();
  }, [getNotes]);

  // track input focus
  useEffect(() => {
    inputElementRef.current?.focus();
    inputElementRef.current?.addEventListener('focusout', () => {
      setShowInputBox(false);
    });

    return () => {
      inputElementRef.current?.removeEventListener('focusout', () => {
        setShowInputBox(false);
      });
    }

  }, [showInputBox === true]);

  if (currentWorkspace !== "" && currentWorkspace !== "none") {
    return (
      <div className='mr-0.5 flex items-center justify-end'>
        <Command className="w-[10.8rem] rounded-sm border shadow-md">
          <CommandInput placeholder="Find Notes..." className='h-9 font-medium' />
          <CommandList>
            <CommandEmpty className='flex h-10 flex-row items-center justify-center gap-1'>
              <span className='ml-1 text-sm font-medium'>0 notes found</span>
              <Frown size={16} />
            </CommandEmpty>
            <Separator />
            <CommandGroup heading="Notes" className='' >
              {notes.map((note, index) => (
                <CommandItem key={`${note.id}-${index}`} className={cn('cursor-pointer hover:bg-accent rounded-sm',
                  (index !== 0 && index !== notes.length - 1) && 'my-1',
                  note.title === currentNote && 'bg-sec hover:bg-sec font-medium'
                )} onSelect={() => {
                  invoke("update_user_note", { title: note.title }).then(() => {
                    setCurrentNote(note);
                  })
                }}>
                  <span>{note.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </CommandList>
          {!showInputBox ? (
            <Button variant="ghost" className='flex h-8 flex-row items-center justify-center rounded-none'
              onClick={() => setShowInputBox(true)}>
              <Plus size={16} />
              Add New Note
            </Button>
          ) : (
            <input ref={inputElementRef} type="text" className='h-8 w-full rounded-sm rounded-t-none px-1 text-center text-sm font-medium shadow-sm outline-1 outline-input focus:outline' placeholder={`New Note #${notes.length + 1}...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputElementRef.current?.value !== '') {
                  //console.log('submit');
                  e.preventDefault();
                  let name = inputElementRef.current?.value;
                  invoke("create_note", { title: name, workspaceId: currentWorkspaceObject.id }).then(() => {
                    invoke("update_user_note", { title: name }).then(() => {
                      invoke("get_note_by_title", { currentNote: name }).then((res) => {
                        let createdNote: Note = JSON.parse(res as string);
                        setCurrentNote({ id: createdNote.id, title: createdNote.title, workspace_id: currentWorkspaceObject.id, save_data: '', created_at: "fake", updated_at: "fake" })
                        setNotes((prev) => [...prev, { id: createdNote.id, title: createdNote.title, workspace_id: currentWorkspaceObject.id, save_data: '', created_at: "fake", updated_at: "fake" }])
                      })
                    })
                  }).then(() => {
                    invoke('update_user_workspace', { workspaceTitle: currentWorkspace }).catch((e) => {
                      console.log(e)
                    });
                  }).catch((e) => {
                    console.log(e)
                  });
                  setShowInputBox(false);
                }
              }}
            />
          )}

        </Command>
      </div>
    )
  }

}

