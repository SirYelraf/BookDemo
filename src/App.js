import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LibraryPage from './components/LibrarySimple'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LibraryPage />} />
            </Routes>
        </BrowserRouter>
    )
}

