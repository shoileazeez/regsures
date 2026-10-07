export default function InteriorHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="interior-hero shell">
      <p className="kicker">
        <span className="kicker-line" />
        {eyebrow}
      </p>
      <h1>{title}</h1>
      {children && <div className="interior-lede">{children}</div>}
    </section>
  );
}
