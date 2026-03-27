"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLiveEditor, BlockData } from "../../components/admin/LiveEditorContext";

type EditableProps<T extends React.ElementType> = {
    as?: T;
    blockId: string;
    field: string;
    initialValue: string;
    className?: string;
    placeholder?: string;
} & React.ComponentPropsWithoutRef<T>;

export const Editable = <T extends React.ElementType = "span">({
    as,
    blockId,
    field,
    initialValue,
    className = "",
    placeholder = "Type here...",
    ...rest
}: EditableProps<T>) => {
    const Component = as || "span";
    const { isEditMode, updateBlock, blocks } = useLiveEditor();

    // Find the current value from the context if it exists, otherwise use initialValue
    const block = blocks.find((b: BlockData) => b.id === blockId);
    // Resolve nested fields like 'content.title'
    const resolveField = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
    };

    const value = block ? resolveField(block, field) ?? initialValue : initialValue;

    // Local state for the input
    const [localValue, setLocalValue] = useState(value);
    const elementRef = useRef<HTMLElement>(null);

    // Sync from context when it changes (e.g. initial load)
    useEffect(() => {
        // Only update the actual DOM element if it's not currently focused
        // to avoid cursor jumping/reversing during typing.
        if (elementRef.current && document.activeElement !== elementRef.current) {
            elementRef.current.innerText = value;
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLElement>) => {
        // We don't set state here to avoid re-rendering the component 
        // which would reset the cursor position.
        // The value will be saved on Blur.
    };

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.innerText;
        if (newValue !== value) {
            // Nested object update logic
            const fieldParts = field.split('.');
            let updateObj: any = {};

            if (fieldParts.length === 1) {
                updateObj[field] = newValue;
            } else if (fieldParts.length === 2) {
                updateObj[fieldParts[0]] = {
                    ...block?.[fieldParts[0]],
                    [fieldParts[1]]: newValue
                };
            }

            updateBlock(blockId, updateObj);
        }
    };

    if (!isEditMode) {
        return (
            <Component className={className} {...rest}>
                {value}
            </Component>
        );
    }

    return (
        <Component
            ref={elementRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            className={`cursor-text outline-none hover:ring-2 hover:ring-[#ff5a00]/50 focus:ring-2 focus:ring-[#ff5a00] rounded px-1 transition-all ${className}`}
            onBlur={handleBlur}
            onInput={handleInput}
            data-placeholder={placeholder}
            // Initialize content once via ref or effect, not bound to state
            {...rest}
        >
            {value}
        </Component>
    );
};
