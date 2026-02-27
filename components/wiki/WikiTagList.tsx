interface WikiTagListProps {
  tags: string[];
}

export function WikiTagList({ tags }: WikiTagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-black/20 bg-white/70 px-2 py-1 text-[11px] text-black/70"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

