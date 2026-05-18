import React from "react"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel de Administracion | HappyCheese',
  description: 'Gestiona los sabores y pedidos de HappyCheese',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
