import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock, Pencil, Trash2 } from 'lucide-react'
import type { Store } from '@/lib/types'

interface StoreCardProps {
  store: Store
  onEdit: (store: Store) => void
  onDelete: (id: string) => void
}

/**
 * Componente para mostrar una tienda individual
 * Principio Single Responsibility: Solo muestra una tienda
 */
export function StoreCard({ store, onEdit, onDelete }: StoreCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg">{store.name}</h3>
              {!store.active && <Badge variant="secondary">Inactiva</Badge>}
            </div>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {store.address}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {store.phone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {store.hours}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onEdit(store)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}
