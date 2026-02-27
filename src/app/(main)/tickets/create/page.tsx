import { redirect } from "next/navigation";

export default async function TicketCreateRedirectPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await props.searchParams;
    const category = params.category || '';

    if (category) {
        redirect(`/tickets/mine?create=true&category=${category}`);
    } else {
        redirect('/tickets/mine?create=true');
    }
}
