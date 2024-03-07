"use client"

import { cn } from '@/lib/utils';
import { useDragControls, motion } from 'framer-motion';
import React, { SetStateAction, useCallback, useEffect, useState } from 'react'
import SelectWorkspace from './select-workspace';
import { invoke } from '@tauri-apps/api/core';
import { Separator } from '@/components/ui/separator';
import NoteSection from './note-section';
import { Note } from '../../dashboard';
import { useRouter } from 'next/navigation';

export default function SideLeft({ currentNote, setCurrentNote }: { currentNote: string | undefined, setCurrentNote: (value: Note) => void }) {
    const [currentWorkspace, setCurrentWorkspace] = useState<string>("");
    let router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const controls = useDragControls();

    const useSetCurrentWorkspaceHook = (currentWorkspace: string) => {
        setCurrentWorkspace(currentWorkspace);
    }

    useEffect(() => {
        // user has a `currentWorkspace` column 
        if (currentWorkspace === "none") return;
        invoke("get_user").then((res: any) => {
            let json_result = JSON.parse(res);
            //console.log(json_result[0].current_workspace);
            if (currentWorkspace !== "none")
                setCurrentWorkspace(json_result[0].current_workspace);
        }).catch((e) => {
            console.log(e)
        })
    }, []);

    const updateUserWorkspace = useCallback(() => {
        if (currentWorkspace === "none" || currentWorkspace == "") return;
        invoke('update_user_workspace', { workspaceTitle: currentWorkspace }).catch((e) => {
            console.log(e)
        });
    }, [currentWorkspace])

    useEffect(() => {
        updateUserWorkspace();
    }, [updateUserWorkspace])


    return (
        <motion.section className={cn('z-10 w-auto ml-10 pl-3.5 flex h-full flex-row-reverse bg-background shadow-md border-r-2 border-sec',
            isDragging && "cursor-grabbing"
        )}
            onMouseLeave={() => { setIsDragging(false); setIsHovering(false); }}
            initial={{ x: -226 }}
            exit={{ x: -226 }}
            drag="x"
            dragConstraints={{ left: -225.5, right: -40 }}
            dragElastic={0.02}

        >
            <div className={cn('flex h-full w-3 bg-sec flex-row gap-1 items-center justify-center transition-opacity duration-300 border-l-2 border-sec',
                !isHovering && "opacity-0 cursor-default",
                isHovering && "cursor-grab",
                isDragging && "cursor-grabbing",
            )}
                onMouseEnter={() => setIsHovering(true)}
                onMouseDown={() => { setIsDragging(true) }}
                onMouseUp={() => { setIsDragging(false); }}
                onPointerDown={(e) => { controls.start(e) }}
            >
                <span className='h-1/2 w-1 rounded-md bg-tert'></span>
            </div>
            <div className={cn('mr-1 flex h-fit flex-col z-50 ',
            )}>
                <div className='flex h-full w-full justify-end py-4'>
                    <SelectWorkspace currentWorkspace={currentWorkspace} setCurrentWorkspace={useSetCurrentWorkspaceHook} />
                </div>
                <Separator className='mb-4' />
                <div>
                    <NoteSection currentWorkspace={currentWorkspace} setCurrentNote={setCurrentNote} currentNote={currentNote} />
                </div>
            </div>
        </ motion.section >

    )

}




