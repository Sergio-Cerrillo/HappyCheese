import type { Flavor } from './types'

export function getFlavorImageSrc(
  flavor: Pick<Flavor, 'image'> & Partial<Pick<Flavor, 'imageThumb'>>,
  variant: 'thumb' | 'full' = 'thumb'
): string {
  if (variant === 'thumb') {
    return flavor.imageThumb || flavor.image || '/images/clasica.jpg'
  }

  return flavor.image || flavor.imageThumb || '/images/clasica.jpg'
}
