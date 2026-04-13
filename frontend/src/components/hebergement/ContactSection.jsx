// SRP : Composant dédié à l'affichage des informations de contact
import { memo } from 'react'

const ContactSection = memo(({ contact }) => {
  const hasContact = contact?.telephone || contact?.email || contact?.site_web

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
      <h2 className="text-xl font-semibold mb-4">Contact</h2>
      {hasContact ? (
        <div className="space-y-4">
          {contact.telephone && (
            <div>
              <div className="text-sm text-gray-500">Téléphone</div>
              <div className="font-medium">{contact.telephone}</div>
            </div>
          )}
          {contact.email && (
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{contact.email}</div>
            </div>
          )}
          {contact.site_web && (
            <div>
              <div className="text-sm text-gray-500">Site web</div>
              <a
                href={contact.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {contact.site_web}
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mt-4">Aucune information de contact disponible</p>
      )}
    </div>
  )
})

export default ContactSection
