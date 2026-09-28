// Rooms of the house artwork (public/img/house.webp), in the image's own pixels.
export const HOUSE_IMG = `${import.meta.env.BASE_URL}img/house.webp`
export const IMG_W = 1152
export const IMG_H = 2048

export type RoomId = 'gym' | 'bathroom' | 'kitchen' | 'studio' | 'entrance'

export const ROOMS: Record<RoomId, { name: string; what: string; to: string; x: number; y: number; w: number; h: number }> = {
  gym: { name: 'Gym', what: 'Workouts', to: '/workout', x: 67, y: 189, w: 457, h: 608 },
  bathroom: { name: 'Bathroom', what: 'Sleep, weight & habits', to: '/habits', x: 666, y: 189, w: 425, h: 608 },
  kitchen: { name: 'Kitchen', what: 'Food', to: '/food', x: 26, y: 875, w: 440, h: 638 },
  studio: { name: 'Studio', what: 'Progress', to: '/progress', x: 722, y: 875, w: 407, h: 638 },
  entrance: { name: 'Today', what: "Today's plan", to: '/today', x: 500, y: 1180, w: 170, h: 440 },
}
