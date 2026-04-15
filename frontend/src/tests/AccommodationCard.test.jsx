import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AccommodationCard from '../components/hebergement/AccommodationCard'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { favoriteService } from '../services/favorite.service'

vi.mock('../services/favorite.service')

const mockHebergement = {
  _id: '1',
  nom: 'Hotel Paris',
  type: 'hotel',
  image_cover: 'https://example.com/image.jpg',
  localisation: {
    commune: 'Paris',
    region: 'Ile-de-France'
  },
  classification: 3,
  capacite: {
    lits: 2
  }
}

const renderWithProviders = (component, authValue = null) => {
  const MockAuthProvider = ({ children }) => {
    const auth = authValue || {
      user: null,
      isAuthenticated: false,
      loading: false
    }
    return (
      <BrowserRouter>
        <AuthProvider value={auth}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    )
  }
  return render(<MockAuthProvider>{component}</MockAuthProvider>)
}

describe('AccommodationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render accommodation details', () => {
    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />)

    expect(screen.getByText('Hotel Paris')).toBeInTheDocument()
    expect(screen.getByText('Paris, Ile-de-France')).toBeInTheDocument()
    expect(screen.getByText('hotel')).toBeInTheDocument()
    expect(screen.getByText('Voir détails')).toBeInTheDocument()
  })

  it('should display correct number of stars for classification', () => {
    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />)

    expect(screen.getByText('★★★')).toBeInTheDocument()
  })

  it('should display beds count with correct pluralization', () => {
    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />)

    expect(screen.getByText('2 lits')).toBeInTheDocument()
  })

  it('should link to accommodation detail page', () => {
    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/hebergement/1')
  })

  it('should show favorite button for authenticated users', async () => {
    const authValue = {
      user: { id: 1, name: 'Test' },
      isAuthenticated: true,
      loading: false
    }
    favoriteService.check.mockResolvedValue(false)

    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />, authValue)

    await waitFor(() => {
      const favoriteButton = screen.getByRole('button', {
        name: /ajouter aux favoris/i
      })
      expect(favoriteButton).toBeInTheDocument()
    })
  })

  it('should show favorite button for unauthenticated users', () => {
    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />)

    expect(screen.getByRole('button', {
      name: /ajouter aux favoris/i
    })).toBeInTheDocument()
  })

  it('should check favorite status on mount for authenticated users', async () => {
    const authValue = {
      user: { id: 1, name: 'Test' },
      isAuthenticated: true,
      loading: false
    }
    favoriteService.check.mockResolvedValue(true)

    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />, authValue)

    await waitFor(() => {
      expect(favoriteService.check).toHaveBeenCalledWith('1')
    })
  })

  it('should show alert when unauthenticated user clicks favorite', async () => {
    const authValue = {
      user: null,
      isAuthenticated: false,
      loading: false
    }

    const windowAlert = window.alert
    window.alert = vi.fn()

    renderWithProviders(<AccommodationCard hebergement={mockHebergement} />, authValue)

    const favoriteButton = screen.getByRole('button', {
      name: /ajouter aux favoris/i
    })
    fireEvent.click(favoriteButton)

    expect(window.alert).toHaveBeenCalledWith('Veuillez vous connecter pour ajouter des favoris')

    window.alert = windowAlert
  })
})
