type AlertVariant = "error" | "success";

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-rose text-red",
  success: "bg-sage text-forest",
};

export function Alert({ variant, title, children }: { variant: AlertVariant; title: string; children?: string }) {
  return (
    <div className={`rounded-card px-5 py-4 text-sm ${variantClasses[variant]}`} role={variant === "error" ? "alert" : "status"}>
      <p className="font-medium">{title}</p>
      {children ? <p className="mt-0.5">{children}</p> : null}
    </div>
  );
}
