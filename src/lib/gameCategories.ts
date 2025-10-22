export type GameCategory = 'kids' | 'educational' | 'music' | 'fashion' | 'food' | 'health';

export const GAME_CATEGORIES: { id: GameCategory; title: string; blurb: string; icon: string }[] = [
    { id: 'kids', title: 'Kids', blurb: 'Friendly general knowledge for ages ≤ 12.', icon: '🧸' },
    { id: 'educational', title: 'Educational', blurb: 'STEM, history, geography, civics & more.', icon: '🎓' },
    { id: 'music', title: 'Music', blurb: 'Artists, DJs, songs, instruments & genres.', icon: '🎵' },
    { id: 'fashion', title: 'Fashion', blurb: 'Styles, fabrics, icons, brands and culture.', icon: '👗' },
    { id: 'food', title: 'Food', blurb: 'Culinary arts, ingredients, world cuisines & etiquette.', icon: '🍽️' },
    { id: 'health', title: 'Health', blurb: 'Wellness, fitness, first aid & medical basics.', icon: '💚' },
];