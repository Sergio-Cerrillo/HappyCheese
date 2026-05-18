"use client"

import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useCursor, MeshReflectorMaterial, Image, Text, Environment } from '@react-three/drei'
import { useRoute, useLocation } from 'wouter'
import { easing } from 'maath'
import getUuid from 'uuid-by-string'

const GOLDENRATIO = 1.61803398875

const images = [
    // Front
    { position: [0, 0, 1.5], rotation: [0, 0, 0], url: '/hc/1.jpeg' },
    // Back
    { position: [-0.8, 0, -0.6], rotation: [0, 0, 0], url: '/hc/2.JPG' },
    { position: [0.8, 0, -0.6], rotation: [0, 0, 0], url: '/hc/3.jpeg' },
    // Left
    { position: [-1.75, 0, 0.25], rotation: [0, Math.PI / 2.5, 0], url: '/hc/4.jpeg' },
    { position: [-2.15, 0, 1.5], rotation: [0, Math.PI / 2.5, 0], url: '/hc/5.jpeg' },
    { position: [-2, 0, 2.75], rotation: [0, Math.PI / 2.5, 0], url: '/hc/6.jpeg' },
    // Right
    { position: [1.75, 0, 0.25], rotation: [0, -Math.PI / 2.5, 0], url: '/hc/7.jpeg' },
    { position: [2.15, 0, 1.5], rotation: [0, -Math.PI / 2.5, 0], url: '/hc/8.jpeg' },
    { position: [2, 0, 2.75], rotation: [0, -Math.PI / 2.5, 0], url: '/hc/9.jpeg' }
]

export function Gallery3DSection() {
    const [mounted, setMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setMounted(true)
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024
            console.log('Mobile check:', mobile, 'Width:', window.innerWidth)
            setIsMobile(mobile)
        }
        checkMobile()

        window.addEventListener('resize', checkMobile, { passive: true })
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <section className="relative h-screen w-full" style={{
            background: '#191920'
        }}>
            <div className="absolute top-0 left-0 right-0 z-10 text-center pt-8 md:pt-12 px-4 pointer-events-none">
                <p className="font-medium uppercase tracking-wider mb-1 md:mb-2 text-xs md:text-sm" style={{ color: '#E8B059' }}>
                    Nuestra Colección {isMobile && '(Mobile)'}
                </p>
                <p className="mt-2 md:mt-4 max-w-2xl mx-auto text-xs md:text-base" style={{ color: '#d4d4d4' }}>
                    Explora nuestra variedad haciendo click en las imágenes
                </p>
            </div>

            {mounted && (
                <Canvas
                    key={isMobile ? 'mobile' : 'desktop'}
                    dpr={[1, 1.5]}
                    camera={{
                        fov: isMobile ? 140 : 90,
                        position: isMobile ? [0, 3, 10] : [0, 2, 50]
                    }}>
                    <color attach="background" args={['#191920']} />
                    <fog attach="fog" args={['#191920', 0, isMobile ? 60 : 15]} />
                    <group position={[0, -0.5, 0]} scale={isMobile ? 0.55 : 1}>
                        <Frames images={images} isMobile={isMobile} />
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[50, 50]} />
                            <MeshReflectorMaterial
                                blur={[300, 100]}
                                resolution={2048}
                                mixBlur={1}
                                mixStrength={80}
                                roughness={1}
                                depthScale={1.2}
                                minDepthThreshold={0.4}
                                maxDepthThreshold={1.4}
                                color="#050505"
                                metalness={0.5}
                            />
                        </mesh>
                    </group>
                    <Environment preset="city" />
                </Canvas>
            )}
        </section>
    )
}

function Frames({ images, isMobile, q = new THREE.Quaternion(), p = new THREE.Vector3() }: any) {
    const ref = useRef<THREE.Group>(null!)
    const clicked = useRef<THREE.Object3D | null>(null)
    const [, params] = useRoute('/item/:id')
    const [, setLocation] = useLocation()

    useEffect(() => {
        if (!ref.current) return
        clicked.current = ref.current.getObjectByName(params?.id || '') || null
        if (clicked.current) {
            clicked.current.parent?.updateWorldMatrix(true, true)
            clicked.current.parent?.localToWorld(p.set(0, GOLDENRATIO / 2, 1.25))
            clicked.current.parent?.getWorldQuaternion(q)
        } else {
            // En móvil, ajustar la posición Z para la vista general
            p.set(0, 0, isMobile ? 20 : 5.5)
            q.identity()
        }
    })

    useFrame((state, dt) => {
        easing.damp3(state.camera.position, p, 0.4, dt)
        easing.dampQ(state.camera.quaternion, q, 0.4, dt)
    })

    return (
        <group
            ref={ref}
            onClick={(e: any) => {
                e.stopPropagation()
                setLocation(clicked.current === e.object ? '/' : '/item/' + e.object.name)
            }}
            onPointerMissed={() => setLocation('/')}>
            {images.map((props: any) => <Frame key={props.url} {...props} />)}
        </group>
    )
}

function Frame({ url, c = new THREE.Color(), ...props }: any) {
    const image = useRef<any>(null!)
    const frame = useRef<any>(null!)
    const [, params] = useRoute('/item/:id')
    const [hovered, hover] = useState(false)
    const [rnd] = useState(() => Math.random())
    const name = getUuid(url)
    const isActive = params?.id === name
    useCursor(hovered)

    useFrame((state, dt) => {
        if (image.current?.material) {
            image.current.material.zoom = 2 + Math.sin(rnd * 10000 + state.clock.elapsedTime / 3) / 2
            easing.damp3(
                image.current.scale,
                [0.85 * (!isActive && hovered ? 0.85 : 1), 0.9 * (!isActive && hovered ? 0.905 : 1), 1],
                0.1,
                dt
            )
        }
        if (frame.current?.material) {
            easing.dampC(frame.current.material.color, hovered ? 'grey' : 'white', 0.1, dt)
        }
    })

    return (
        <group {...props}>
            <mesh
                name={name}
                onPointerOver={(e: any) => {
                    e.stopPropagation()
                    hover(true)
                }}
                onPointerOut={() => hover(false)}
                scale={[1, GOLDENRATIO, 0.05]}
                position={[0, GOLDENRATIO / 2, 0]}>
                <boxGeometry />
                <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.5} envMapIntensity={2} />
                <mesh ref={frame} raycast={() => null} scale={[0.9, 0.93, 0.9]} position={[0, 0, 0.2]}>
                    <boxGeometry />
                    <meshBasicMaterial toneMapped={false} fog={false} />
                </mesh>
                <Image raycast={() => null} ref={image} position={[0, 0, 0.7]} url={url} />
            </mesh>
            <Text maxWidth={0.1} anchorX="left" anchorY="top" position={[0.55, GOLDENRATIO, 0]} fontSize={0.025} color="#333">
                {name.split('-').join(' ')}
            </Text>
        </group>
    )
}
