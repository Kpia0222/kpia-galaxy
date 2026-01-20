import { createContext } from 'react';
import * as THREE from 'three';

export const RefContext = createContext<React.MutableRefObject<Map<string, THREE.Object3D>> | null>(null);
