import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';

export default function Icon({ icon }: { icon: string }) {
    return (
        <svg className="bi d-block w-100 h-100" fill="currentColor">
            <use xlinkHref={`${bootstrapIcons}#${icon}`} />
        </svg>
    );
}
