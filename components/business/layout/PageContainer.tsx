type PageContainerProps = {
  title?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export function PageContainer({
  title,
  children,
  maxWidthClassName = "max-w-3xl",
}: PageContainerProps) {
  return (
    <main className={`mx-auto ${maxWidthClassName} px-4 py-8`}>
      {title && (
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      )}
      {children}
    </main>
  );
}
