"use client"

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { Note } from '../../dashboard'
import { Bold, Italic, Strikethrough, Trash2, Underline } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Editor({ currentNote, setCurrentNote, workspaceId }: { currentNote: Note, setCurrentNote: (currentNote: Note) => void, workspaceId: string | undefined }) {
    let router = useRouter();
    const notesContainerDivRef = useRef<HTMLDivElement>(null);
    const [saveData, setSaveData] = useState<string>("");

    const setCursorLastNode = () => {
        if (notesContainerDivRef.current) {
            const range = document.createRange();
            const sel = window.getSelection();
            const nodes = Array.from(notesContainerDivRef.current.childNodes);
            let lastTextNode = null;

            for (let i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType === Node.TEXT_NODE) {
                    lastTextNode = nodes[i];
                    break;
                }
            }

            if (lastTextNode) {
                if (lastTextNode.nodeValue)
                    range.setStart(lastTextNode, lastTextNode.nodeValue.length);
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }

            notesContainerDivRef.current.focus();
        }
    }

    const setAsTitle = ({
        innerText,
        tempContainer,
        childNodes
    }: {
        innerText: string | undefined,
        tempContainer: HTMLDivElement
        childNodes: ChildNode[],

    }) => {
        if (innerText?.match(/# ([\s\S]*?)(?=\n\n|$)/gm)) {
            // Replace lines starting with "## " with bold version, handling potential HTML 
            if (notesContainerDivRef.current?.innerText) {

                for (const child of childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.startsWith('# ')) {
                        let strongNode = document.createElement('strong');
                        strongNode.style.fontSize = "2rem"
                        strongNode.textContent = child.textContent.slice(2);
                        child.replaceWith(strongNode);
                    }
                };

                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;

            }
        }

    }

    const handleOnInput = (event: FormEvent<HTMLDivElement>) => {
        setSaveData(event.currentTarget.innerText)
        let innerText = notesContainerDivRef.current?.innerText
        let tempContainer = document.createElement("div");
        if (innerText)
            tempContainer.innerText = innerText;

        let childNodes = Array.from(tempContainer.childNodes)

        setAsTitle({ innerText: innerText, tempContainer: tempContainer, childNodes });
    }

    const handleDeleteNote = () => {
        invoke("delete_note", { currentNoteId: currentNote.id }).then(() => {
            console.log(workspaceId)
            invoke("get_notes", { workspaceId: workspaceId }).then((res) => {
                const parsedNotes = JSON.parse(res as string);
                if (parsedNotes.length > 0) {
                    //console.log(parsedNotes[0])
                    invoke("update_user_note", { title: parsedNotes[0].title as Note }).then(() => setCurrentNote(parsedNotes[0] as Note))
                } else {
                    invoke("update_user_note", { title: "none" }).then(() => setCurrentNote(parsedNotes[0] as Note))
                    router.refresh();
                }
            })
        })
    }

    // const handleRenameNote = () => {

    // }

    // set saved data on startup
    useEffect(() => {
        if (currentNote.save_data) {
            invoke("get_note_save_data", { id: currentNote.id }).then((res) => {
                let json: Note = JSON.parse(res as string)
                let saveData = json.save_data;
                console.log(saveData)
                if (notesContainerDivRef.current) {
                    notesContainerDivRef.current.innerText = saveData;
                }

                let innerText = notesContainerDivRef.current?.innerText;

                // Replace lines starting with "## " with bold version, handling potential HTML 
                // if (notesContainerDivRef.current?.innerText && innerText) {
                //     const tempContainer = document.createElement('div'); // Create a temporary container
                //     tempContainer.innerText = innerText;

                //     Array.from(tempContainer.childNodes).forEach(child => {
                //         if (child.nodeType === Node.TEXT_NODE && child.textContent?.startsWith('## ')) {
                //             let strongNode = document.createElement('strong');
                //             strongNode.textContent = child.textContent.slice(3);
                //             child.replaceWith(strongNode);
                //         }
                //     });

                //     notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                // }


            })
        } else {
            if (notesContainerDivRef.current) {
                notesContainerDivRef.current.innerText = "";
            }
        }

    }, [currentNote]);

    useEffect(() => {
        console.log(saveData)
        if (saveData) {
            invoke("save_notes", { data: saveData, currentNoteId: currentNote.id });
            let splitLines = saveData.split("\n");
            console.log(splitLines)
            // for (let i = 0; i < splitLines.length; i++) {
            //     if (splitLines[i].includes("##")) {

            //     }
            // }
        }

    }, [saveData]);


    return (
        <div className={cn('fixed z-0 h-full w-full bg-accent p-4 pl-9',
            notesContainerDivRef.current?.innerText && notesContainerDivRef.current?.innerText.length > 500 && "overflow-auto"
        )}

        >
            <div className='flex h-fit w-full flex-row justify-start rounded-sm bg-quat p-2 outline outline-quat drop-shadow-sm'>
                <h1 className='text-3xl font-bold'>{currentNote.title}</h1>
                <menu>
                    <li className={cn('ml-0.5 cursor-pointer rounded-sm p-0.5 hover:bg-red-500 hover:text-white',

                    )}>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Trash2 size={20} className='drop-shadow-md' />
                            </AlertDialogTrigger>
                            <AlertDialogContent className='rounded-sm'>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className='text-xl'>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className='text-base'>
                                        <span>
                                            This action <u>cannot be undone.</u>
                                        </span>
                                        <br />
                                        <span>
                                            You will lose any content in <b className='rounded-sm bg-muted px-0.5 text-foreground'>{currentNote.title}</b> <b className='font-bold text-destructive'>forever.</b>
                                        </span>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className='text-base'>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className='duration-400 flex flex-row gap-1 bg-destructive text-base text-background outline outline-input transition-opacity hover:opacity-80'

                                        onClick={handleDeleteNote}
                                    >
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </li>
                </menu>
            </div>
            <menu className='mt-4 flex h-8 w-full flex-row items-center justify-start gap-0.5 rounded-t-sm border-b-2 border-quat bg-tert p-1 drop-shadow-md'>
                <li className='cursor-pointer rounded-sm p-0.5 hover:bg-quat'>
                    <Bold size={17} strokeWidth={3.1} />
                </li>
                <li className='cursor-pointer rounded-sm p-0.5 hover:bg-quat'>
                    <Italic size={17} strokeWidth={3.1} />
                </li>
                <li className='cursor-pointer rounded-sm p-0.5 hover:bg-quat'>
                    <Strikethrough size={17} strokeWidth={3.1} />
                </li>
                <li className='cursor-pointer rounded-sm p-0.5 hover:bg-quat'>
                    <Underline size={17} strokeWidth={3.1} />
                </li>
            </menu>
            <div className='h-full w-full bg-background drop-shadow-lg' >
                <div contentEditable className='inline-block h-full w-full px-5 py-4 outline-none'
                    onInput={handleOnInput} ref={notesContainerDivRef} >

                </div>
            </div>
        </div>
    )
}
