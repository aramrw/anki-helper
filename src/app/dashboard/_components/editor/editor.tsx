"use client"

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { Note } from '../../dashboard'
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function Editor({ currentNote }: { currentNote: Note }) {

    const notesContainerDivRef = useRef<HTMLDivElement>(null);

    const [saveData, setSaveData] = useState<string>("");

    const setAsTitle = () => {
        let innerText = notesContainerDivRef.current?.innerText;

        if (innerText?.match(/## (.*)$/gm)) {
            // Replace lines starting with "## " with bold version, handling potential HTML 
            if (notesContainerDivRef.current?.innerText && innerText) {
                const tempContainer = document.createElement('div'); // Create a temporary container
                tempContainer.innerText = innerText;

                Array.from(tempContainer.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.startsWith('## ')) {
                        let strongNode = document.createElement('strong');
                        strongNode.style.fontSize = "20px"
                        strongNode.textContent = child.textContent.slice(3);
                        child.replaceWith(strongNode);
                    }
                });

                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
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
        }
    }

    const handleOnInput = (event: FormEvent<HTMLDivElement>) => {
        setSaveData(event.currentTarget.innerText)
    }

    // set saved data on startup
    useEffect(() => {
        if (currentNote.save_data)
            invoke("get_note_save_data", { id: currentNote.id }).then((res) => {

                let json: Note = JSON.parse(res as string)
                let saveData = json.save_data;
                if (notesContainerDivRef.current) {
                    notesContainerDivRef.current.innerText = saveData;
                }

                let innerText = notesContainerDivRef.current?.innerText;

                // Replace lines starting with "## " with bold version, handling potential HTML 
                if (notesContainerDivRef.current?.innerText && innerText) {
                    const tempContainer = document.createElement('div'); // Create a temporary container
                    tempContainer.innerText = innerText;

                    Array.from(tempContainer.childNodes).forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE && child.textContent?.startsWith('## ')) {
                            let strongNode = document.createElement('strong');
                            strongNode.textContent = child.textContent.slice(3);
                            child.replaceWith(strongNode);
                        }
                    });

                    notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                }


            })
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
        <div className='fixed z-0 h-full w-full bg-accent p-4 pl-9'

        >
            <div className='h-fit w-full rounded-sm bg-sec p-2 drop-shadow-sm'>
                <h1 className='text-3xl font-bold'>{currentNote.title}</h1>
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
