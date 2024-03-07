import React, { useState } from 'react'
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
import { PencilLine, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Note } from '@/app/dashboard/dashboard'
import { invoke } from '@tauri-apps/api/core'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'

export default function TitleTools({
    currentNote,
    setCurrentNote,
    workspaceId,
}: {
    currentNote: Note
    setCurrentNote: (currentNote: Note) => void
    workspaceId: string | undefined
}) {


    const [newTitle, setNewTitle] = useState<string>("");

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
                }
            })
        })
    }

    const handleRenameNote = (newTitle: string) => {
        invoke("rename_note", { currentNoteId: currentNote.id, newTitle: newTitle })
    }

    return (
        <menu className='flex h-fit flex-row'>
            {/* Rename Note */}
            <li className={cn('ml-0.5 cursor-pointer rounded-sm p-0.5 hover:bg-quin hover:text-white',
            )}>
                <Dialog>
                    <DialogTrigger asChild>
                        <PencilLine size={20} className='drop-shadow-md' />
                    </DialogTrigger>
                    <DialogContent className="rounded-sm sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className='flex flex-row gap-1.5 font-bold'>
                                <PencilLine size={20} className='drop-shadow-md' />
                                Rename Note
                            </DialogTitle>
                            <DialogDescription className=''>
                                Rename your current note to something else.
                                <br />
                                <span className='font-bold underline'>This action is undoable</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid">
                            <div className="grid cursor-not-allowed grid-cols-4 items-center gap-4">
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="rounded-sm bg-tert p-1 text-center font-bold">
                                    New Title
                                </Label>
                                <Input id="new-title" className="col-span-3 text-center font-bold disabled:opacity-100" autoFocus onInput={(e) => setNewTitle(e.currentTarget.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" className={cn('rounded-sm text-base opacity-50 cursor-not-allowed hover:bg-background',
                                newTitle !== "" && newTitle !== currentNote.title && "opacity-100 cursor-pointer hover:bg-accent"
                            )} onClick={(e) => {
                                if (newTitle !== "" && newTitle !== currentNote.title) {
                                    handleRenameNote(newTitle)
                                    invoke("update_user_note", { title: newTitle }).then(() => {
                                        setCurrentNote({ ...currentNote, title: newTitle })
                                    })
                                }

                            }}>Save changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </li>
            {/* Delete Note */}
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
    )
}
