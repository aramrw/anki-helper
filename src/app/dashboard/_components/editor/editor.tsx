"use client"

import React, { FormEvent, use, useEffect, useRef, useState } from 'react'
import { Note } from '../../dashboard'
import { Bold, Italic, Strikethrough, Trash2, Underline } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import TitleTools from './_components/title-tools';

export default function Editor({ currentNote, setCurrentNote, workspaceId }: { currentNote: Note, setCurrentNote: (currentNote: Note) => void, workspaceId: string | undefined }) {
    const notesContainerDivRef = useRef<HTMLDivElement>(null);
    const [saveData, setSaveData] = useState<string>("");
    const [lastLineEdited, setLastLineEdited] = useState<string>("");


    const setCursorLastLine = () => {
        if (notesContainerDivRef.current) {
            const range = document.createRange();
            const sel = window.getSelection();
            const nodes = Array.from(notesContainerDivRef.current.childNodes);
            let lastTextNode = null;

            for (let i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeName === 'STRONG') {
                    //console.log("node:" + nodes[i].textContent)
                    if (nodes[i].textContent === lastLineEdited) {
                        //console.log("its a match")
                        lastTextNode = nodes[i].lastChild;
                        break;
                    }
                }
            }

            if (lastTextNode) {
                if (lastTextNode.nodeValue)
                    range.setStart(lastTextNode, lastTextNode.nodeValue.length);
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
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
        if (innerText?.match(/## ([\s\S]*?)(?=\n\n|$)/gm)) {
            // Replace lines starting with "## " with bold big version.
            if (notesContainerDivRef.current?.innerText) {
                for (const child of childNodes) {
                    console.log(child.nodeName)
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.startsWith('## ')) {
                        //console.log("node name: " + child.parentNode?.nodeName)
                        let strongNode = document.createElement('strong');
                        strongNode.style.fontSize = "1.8rem"
                        strongNode.textContent = child.textContent.slice(2);
                        setLastLineEdited(strongNode.textContent);
                        child.replaceWith(strongNode);
                        continue
                    }
                };

                // update state
                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                setSaveData(notesContainerDivRef.current.innerHTML)
            }
        }

    }

    const handleOnInput = (event: FormEvent<HTMLDivElement>) => {
        setSaveData(event.currentTarget.innerHTML)
        let innerText = notesContainerDivRef.current?.innerHTML
        let tempContainer = document.createElement("div");
        if (innerText)
            tempContainer.innerHTML = innerText;

        let childNodes = Array.from(tempContainer.childNodes)

        setAsTitle({ innerText: innerText, tempContainer: tempContainer, childNodes });
    }

    // insert preserved user sav data into the dom on startup
    useEffect(() => {
        console.log("Current Note: " + currentNote.title)
        if (currentNote.save_data) {
            invoke("get_note_save_data", { id: currentNote.id }).then((res) => {
                let json: Note = JSON.parse(res as string)
                let saveData = json.save_data;

                if (notesContainerDivRef.current) {
                    notesContainerDivRef.current.innerHTML = saveData;
                }

                //let innerText = notesContainerDivRef.current?.innerText;


            })
        } else {
            if (notesContainerDivRef.current) {
                notesContainerDivRef.current.innerText = "";
            }
        }

    }, [currentNote]);

    useEffect(() => {
        if (saveData) {
            console.log("Saving Note Data: " + saveData)
            invoke("save_notes", { data: saveData, currentNoteId: currentNote.id })
            // let splitLines = saveData.split("\n");
            //console.log(splitLines)
            // for (let i = 0; i < splitLines.length; i++) {
            //     if (splitLines[i].includes("##")) {

            //     }
            // }
        }

    }, [saveData]);

    useEffect(() => {

        setCursorLastLine();

    }, [lastLineEdited]);
    return (
        <div className={cn('fixed z-0 h-full w-full bg-accent p-4 pl-9',
            notesContainerDivRef.current?.innerText && notesContainerDivRef.current?.innerText.length > 500 && "overflow-auto"
        )}>
            <div className='flex h-fit w-full flex-row justify-start rounded-sm bg-quat p-2 outline outline-quat drop-shadow-sm'>
                <h1 className='text-3xl font-bold'>{currentNote.title}</h1>
                <TitleTools currentNote={currentNote} setCurrentNote={setCurrentNote} workspaceId={workspaceId} />
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
