// Renders text and highlights any "TODO" marker in it, so missing information
// is easy to spot on the page (and easy to find with a search in the data).

// Matches "TODO", "TODO: something" (up to the next punctuation) and "TODO (note)".
const TODO_PATTERN = /(TODO(?::[^,.;]*| \([^)]*\))?)/g;

export function TodoText({ text }: { text: string }) {
  const parts = text.split(TODO_PATTERN);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        // split() with a capture group puts the matches at the odd indexes.
        i % 2 === 1 ? (
          <mark key={i} className="todo">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
