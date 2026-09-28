// Rooms of the house artwork (public/img/house.webp), in the image's own pixels.
export const HOUSE_IMG = `${import.meta.env.BASE_URL}img/house.webp`
export const IMG_W = 864
export const IMG_H = 1536

export type RoomId = 'gym' | 'bedroom' | 'kitchen' | 'office' | 'entrance'

export const ROOMS: Record<RoomId, { name: string; what: string; to: string; x: number; y: number; w: number; h: number }> = {
  gym: { name: 'Workout', what: 'Training log', to: '/workout', x: 45, y: 142, w: 350, h: 453 },
  bedroom: { name: 'Habits', what: 'Sleep, weight & routines', to: '/habits', x: 482, y: 142, w: 340, h: 453 },
  kitchen: { name: 'Nutrition', what: 'Food log', to: '/food', x: 18, y: 650, w: 334, h: 480 },
  office: { name: 'Learning', what: 'Progress', to: '/progress', x: 520, y: 650, w: 330, h: 480 },
  entrance: { name: 'Today', what: "Today's plan", to: '/today', x: 375, y: 900, w: 120, h: 320 },
}
