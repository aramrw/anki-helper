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
    const [lastLineEdited, setLastLineEdited] = useState<string | undefined>(undefined);

    const handleOnInput = (event: FormEvent<HTMLDivElement>) => {
        setSaveData(event.currentTarget.innerHTML)

        let innerHTML = notesContainerDivRef.current?.innerHTML
        let tempContainer = document.createElement("div");
        if (innerHTML)
            tempContainer.innerHTML = innerHTML;

        let childNodes = Array.from(tempContainer.childNodes)

        setAsTitle({ innerHtml: innerHTML, tempContainer: tempContainer, childNodes });
        setAsBold({ innerHtml: innerHTML, tempContainer: tempContainer, childNodes });
        setAsItalic({ innerHtml: innerHTML, tempContainer: tempContainer, childNodes })
        setAsUnderline({ innerHtml: innerHTML, tempContainer: tempContainer, childNodes })
    }

    const setCursorLastLine = () => {
        const editableDiv = notesContainerDivRef.current;
        if (editableDiv) {
            const range = document.createRange();
            const sel = window.getSelection();
            const childNodes = editableDiv.childNodes;
            if (childNodes.length > 0) {
                const lastChild = childNodes[childNodes.length - 1];
                if (lastChild.nodeType === Node.ELEMENT_NODE && lastChild.nodeName === 'B') {
                    range.setStartAfter(lastChild);
                } else {
                    range.setStart(editableDiv, childNodes.length);
                }
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
                editableDiv.focus();
            }
        }
    }

    // ** Markup Parsing ** //

    const setAsTitle = ({
        innerHtml,
        tempContainer,
        childNodes
    }: {
        innerHtml: string | undefined,
        tempContainer: HTMLDivElement
        childNodes: ChildNode[],
    }) => {
        if (innerHtml?.match(/## ([\s\S]*?)(?=\n\n|$)/gm)) {
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

    const setAsBold = ({
        innerHtml,
        tempContainer,
        childNodes
    }: {
        innerHtml: string | undefined,
        tempContainer: HTMLDivElement
        childNodes: ChildNode[],
    }) => {
        if (innerHtml?.match(/\*\*.*?\*\*/gm)) {
            if (notesContainerDivRef.current?.innerText) {
                for (const child of childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const parts = child.textContent?.split(/(\*\*(.*?)\*\*)/g);
                        if (parts) {
                            const newNodes = document.createDocumentFragment();
                            let slicedNode;
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i].startsWith('**') && parts[i].endsWith('**')) {
                                    const boldNode = document.createElement('b');
                                    boldNode.textContent = parts[i].slice(2, -2);
                                    slicedNode = parts[i].slice(2, -2);
                                    setLastLineEdited(boldNode.textContent);
                                    newNodes.appendChild(boldNode);
                                } else {
                                    if (parts[i] === slicedNode) {
                                        newNodes.appendChild(document.createTextNode(' \u200B')); // replace with space
                                    } else {
                                        newNodes.appendChild(document.createTextNode(parts[i]));
                                    }
                                }
                            }
                            child.replaceWith(newNodes);
                        }
                    }
                };
                // update state
                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                setSaveData(notesContainerDivRef.current.innerHTML)
            }
        }
    }

    const setAsItalic = ({
        innerHtml,
        tempContainer,
        childNodes
    }: {
        innerHtml: string | undefined,
        tempContainer: HTMLDivElement
        childNodes: ChildNode[],
    }) => {
        if (innerHtml?.match(/\_.*?\_/gm)) {
            if (notesContainerDivRef.current?.innerText) {
                for (const child of childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const parts = child.textContent?.split(/(\_(.*?)\_)/g);
                        if (parts) {
                            const newNodes = document.createDocumentFragment();
                            let slicedNode;
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i].startsWith('_') && parts[i].endsWith('_')) {
                                    const boldNode = document.createElement('i');
                                    boldNode.textContent = parts[i].slice(1, -1);
                                    slicedNode = parts[i].slice(1, -1);
                                    setLastLineEdited(boldNode.textContent);
                                    newNodes.appendChild(boldNode);
                                } else {
                                    if (parts[i] === slicedNode) {
                                        newNodes.appendChild(document.createTextNode(' \u200B')); // replace with space
                                    } else {
                                        newNodes.appendChild(document.createTextNode(parts[i]));
                                    }
                                }
                            }
                            child.replaceWith(newNodes);
                        }
                    }
                };
                // update state
                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                setSaveData(notesContainerDivRef.current.innerHTML)
            }
        }
    }

    const setAsUnderline = ({
        innerHtml,
        tempContainer,
        childNodes
    }: {
        innerHtml: string | undefined,
        tempContainer: HTMLDivElement
        childNodes: ChildNode[],
    }) => {
        if (innerHtml?.match(/\_\*.*?\*\_/gm)) {
            if (notesContainerDivRef.current?.innerText) {
                for (const child of childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const parts = child.textContent?.split(/(\_\*(.*?)\*\_)/g);
                        if (parts) {
                            const newNodes = document.createDocumentFragment();
                            let slicedNode;
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i].startsWith('_*') && parts[i].endsWith('*_')) {
                                    const boldNode = document.createElement('ins');
                                    boldNode.textContent = parts[i].slice(2, -2);
                                    slicedNode = parts[i].slice(2, -2);
                                    setLastLineEdited(boldNode.textContent);
                                    newNodes.appendChild(boldNode);
                                } else {
                                    if (parts[i] === slicedNode) {
                                        newNodes.appendChild(document.createTextNode(' \u200B')); // replace with space
                                    } else {
                                        newNodes.appendChild(document.createTextNode(parts[i]));
                                    }
                                }
                            }
                            child.replaceWith(newNodes);
                        }
                    }
                };
                // update state
                notesContainerDivRef.current.innerHTML = tempContainer.innerHTML;
                setSaveData(notesContainerDivRef.current.innerHTML)
            }
        }
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
        if (lastLineEdited && lastLineEdited !== "") {
            setCursorLastLine();
            setLastLineEdited(undefined);
        }

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
            <div className='mb-4 h-fit w-full bg-background drop-shadow-lg' >
                <div contentEditable className='inline-block h-full w-full px-5 py-4 outline-none'
                    onInput={handleOnInput} ref={notesContainerDivRef} >

                </div>
            </div>
        </div>
    )
}
