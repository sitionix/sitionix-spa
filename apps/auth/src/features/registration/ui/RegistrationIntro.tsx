type Props = {
    onEmailOpen: () => void;
}

export default function RegisterIntro({onEmailOpen}: Props) {

    return (
        <div className="w-full max-w-md text-center">
            <div className="text-2xl font-semibold">Реєстрація</div>
            <div className="mt-2 text-lg text-gray-600">
                Створюйте. Керуйте. Процвітайте.
            </div>
            <button
                type="button"
                onClick={onEmailOpen}
                className="mt-6 w-full rounded-lg bg-black py-3 text-sm font-medium text-white shadow"
                >Реєстрація через пошту</button>
            </div>
    );
}