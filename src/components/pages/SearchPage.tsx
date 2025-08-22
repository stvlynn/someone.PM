import SearchInterface from '../SearchInterface'
import './SearchPage.css'

interface SearchPageProps {
  isImageHovered: boolean
}

export default function SearchPage({ isImageHovered }: SearchPageProps) {
  return (
    <section className={`page-section search-page transition-all duration-300 ${
      isImageHovered ? 'blur-sm' : ''
    }`}>
      <SearchInterface />
    </section>
  )
}