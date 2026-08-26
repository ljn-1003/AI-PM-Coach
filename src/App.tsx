import { Route, Routes } from 'react-router-dom'
import Intro from './pages/Intro'
import Landing from './pages/Landing'
import Quiz from './pages/Quiz'
import Result from './pages/Result'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  )
}
