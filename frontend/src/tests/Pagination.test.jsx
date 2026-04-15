import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Pagination from '../components/hebergement/Pagination'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  it('should render current page number', () => {
    renderWithProviders(
      <Pagination
        currentPage={3}
        onPageChange={mockOnPageChange}
        hasPrevious={true}
        hasNext={true}
      />
    )

    expect(screen.getByText('Page 3')).toBeInTheDocument()
  })

  it('should call onPageChange with previous page when "Précédent" is clicked', () => {
    renderWithProviders(
      <Pagination
        currentPage={3}
        onPageChange={mockOnPageChange}
        hasPrevious={true}
        hasNext={true}
      />
    )

    const previousButton = screen.getByText('← Précédent')
    fireEvent.click(previousButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange with next page when "Suivant" is clicked', () => {
    renderWithProviders(
      <Pagination
        currentPage={3}
        onPageChange={mockOnPageChange}
        hasPrevious={true}
        hasNext={true}
      />
    )

    const nextButton = screen.getByText('Suivant →')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  it('should disable previous button when hasPrevious is false', () => {
    renderWithProviders(
      <Pagination
        currentPage={1}
        onPageChange={mockOnPageChange}
        hasPrevious={false}
        hasNext={true}
      />
    )

    const previousButton = screen.getByText('← Précédent')
    expect(previousButton).toBeDisabled()
  })

  it('should disable next button when hasNext is false', () => {
    renderWithProviders(
      <Pagination
        currentPage={5}
        onPageChange={mockOnPageChange}
        hasPrevious={true}
        hasNext={false}
      />
    )

    const nextButton = screen.getByText('Suivant →')
    expect(nextButton).toBeDisabled()
  })

  it('should not call onPageChange when disabled button is clicked', () => {
    renderWithProviders(
      <Pagination
        currentPage={1}
        onPageChange={mockOnPageChange}
        hasPrevious={false}
        hasNext={true}
      />
    )

    const previousButton = screen.getByText('← Précédent')
    fireEvent.click(previousButton)

    expect(mockOnPageChange).not.toHaveBeenCalled()
  })
})
