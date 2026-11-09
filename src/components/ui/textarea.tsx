import * as React from "react"

import { cn } from "@/lib/utils"

const formTextareaClassName =
  "min-h-24 resize-none rounded-3xl border border-slate-100 bg-slate-50/50 p-4 font-medium shadow-none focus-visible:ring-1 focus-visible:ring-accent md:min-h-40 dark:border-slate-800 dark:bg-slate-900"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea, formTextareaClassName }
