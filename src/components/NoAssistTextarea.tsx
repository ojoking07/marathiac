import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes, type InputHTMLAttributes } from "react";

/**
 * Textarea that blocks browser autocorrect, autocomplete, spellcheck, and
 * third-party writing assistants (Grammarly, LanguageTool, Microsoft Editor,
 * Ginger, etc.). Also strips Grammarly's injected DOM on mount.
 *
 * The whole point of this app is that children write English themselves, so
 * we never want an assistant rewriting their sentences.
 */
export const NoAssistTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function NoAssistTextarea(props, ref) {
    const localRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
      const el = localRef.current;
      if (!el) return;
      const attrs = {
        "data-gramm": "false",
        "data-gramm_editor": "false",
        "data-enable-grammarly": "false",
        "data-lt-active": "false",
        "data-lt-installed": "false",
      };
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);

      // Remove any Grammarly wrapper that gets injected around the field.
      const cleanUp = () => {
        el.parentElement?.querySelectorAll("grammarly-extension, grammarly-desktop-integration").forEach(n => n.remove());
      };
      cleanUp();
      const obs = new MutationObserver(cleanUp);
      obs.observe(el.parentElement ?? document.body, { childList: true, subtree: true });
      return () => obs.disconnect();
    }, []);

    return (
      <textarea
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        {...props}
      />
    );
  }
);

export const NoAssistInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function NoAssistInput(props, ref) {
    return (
      <input
        ref={ref}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        {...props}
      />
    );
  }
);
