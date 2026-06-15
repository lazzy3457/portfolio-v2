import { useSearchParams } from 'react-router-dom'
import SectionTrace from "../../component/sectionTrace/SectionTrace"

export default function Projet() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || '';
    return <SectionTrace type={type} />
}
