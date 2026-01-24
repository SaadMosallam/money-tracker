type PageContainerProps = {
  title?: string;
  children: React.ReactNode;
};

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {title && (
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      )}
      {children}
    </main>
  );
}
