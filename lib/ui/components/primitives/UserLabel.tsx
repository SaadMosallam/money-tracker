type UserLabelProps = {
    name: string;
};

export function UserLabel({ name }: UserLabelProps) {
    return (
        <span className="font-medium">
            {name}
        </span>
    );
}
