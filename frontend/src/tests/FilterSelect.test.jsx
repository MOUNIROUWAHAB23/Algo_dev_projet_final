import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import FilterSelect from '../components/hebergement/FilterSelect'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('FilterSelect', () => {
  const mockOptions = [
    { value: 'hotel', label: 'Hôtel' },
    { value: 'gite', label: 'Gîte' },
    { value: 'camping', label: 'Camping' }
  ]

  it('should render with label and placeholder', () => {
    renderWithProviders(
      <FilterSelect
        label="Type"
        value=""
        onChange={() => {}}
        options={mockOptions}
        placeholder="Sélectionner un type"
      />
    )

    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Sélectionner un type')).toBeInTheDocument()
  })

  it('should render all options', () => {
    renderWithProviders(
      <FilterSelect
        label="Type"
        value=""
        onChange={() => {}}
        options={mockOptions}
        placeholder="Sélectionner"
      />
    )

    const select = screen.getByRole('combobox')

    expect(select).toContainHTML('<option value="">Sélectionner</option>')
    expect(select).toContainHTML('<option value="hotel">Hôtel</option>')
    expect(select).toContainHTML('<option value="gite">Gîte</option>')
    expect(select).toContainHTML('<option value="camping">Camping</option>')
  })

  it('should call onChange when value changes', () => {
    const mockOnChange = vi.fn()

    renderWithProviders(
      <FilterSelect
        label="Type"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        placeholder="Sélectionner"
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'hotel' } })

    expect(mockOnChange).toHaveBeenCalledWith('hotel')
  })

  it('should display selected value', () => {
    renderWithProviders(
      <FilterSelect
        label="Type"
        value="gite"
        onChange={() => {}}
        options={mockOptions}
        placeholder="Sélectionner"
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('gite')
  })
})
