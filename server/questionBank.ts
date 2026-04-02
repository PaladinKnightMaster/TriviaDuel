import { Question } from '../shared/schema';

interface QuestionData {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

const questionBank: QuestionData[] = [
  // ─── SCIENCE — EASY ───────────────────────────────────────────────────────
  { category: 'science', difficulty: 'easy', question: 'What planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correctAnswer: 1, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What is the boiling point of water at sea level?', options: ['90°C', '95°C', '100°C', '105°C'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'How many legs does a spider have?', options: ['6', '8', '10', '12'], correctAnswer: 1, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What is the closest star to Earth?', options: ['Sirius', 'Alpha Centauri', 'The Sun', 'Betelgeuse'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], correctAnswer: 1, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What is the chemical formula for water?', options: ['CO2', 'O2', 'H2O', 'NaCl'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'Which organ pumps blood through the human body?', options: ['Brain', 'Lungs', 'Liver', 'Heart'], correctAnswer: 3, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What force keeps planets in orbit around the Sun?', options: ['Magnetism', 'Gravity', 'Friction', 'Electricity'], correctAnswer: 1, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Granite'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What type of animal is a dolphin?', options: ['Fish', 'Amphibian', 'Reptile', 'Mammal'], correctAnswer: 3, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctAnswer: 1, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What color is chlorophyll?', options: ['Blue', 'Yellow', 'Green', 'Red'], correctAnswer: 2, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'What is the speed of light (approximate)?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correctAnswer: 0, timeLimit: 15 },
  { category: 'science', difficulty: 'easy', question: 'Which vitamin does sunlight help the body produce?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correctAnswer: 3, timeLimit: 15 },

  // ─── SCIENCE — MEDIUM ─────────────────────────────────────────────────────
  { category: 'science', difficulty: 'medium', question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctAnswer: 1, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswer: 1, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the name of the force that opposes motion?', options: ['Gravity', 'Inertia', 'Friction', 'Tension'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Cytoplasm'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What type of radiation has the longest wavelength?', options: ['Gamma rays', 'X-rays', 'Ultraviolet', 'Radio waves'], correctAnswer: 3, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the pH level of pure water?', options: ['5', '6', '7', '8'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What process do plants use to make food?', options: ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'], correctAnswer: 1, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the most abundant element in the universe?', options: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the study of earthquakes called?', options: ['Volcanology', 'Seismology', 'Geology', 'Meteorology'], correctAnswer: 1, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'At what temperature does iron melt?', options: ['1,000°C', '1,200°C', '1,538°C', '2,000°C'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the name for the outer layer of Earth?', options: ['Mantle', 'Core', 'Crust', 'Lithosphere'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What gas makes up most of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Argon', 'Nitrogen'], correctAnswer: 3, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'How many chambers does the human heart have?', options: ['2', '3', '4', '5'], correctAnswer: 2, timeLimit: 20 },
  { category: 'science', difficulty: 'medium', question: 'What is the unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctAnswer: 2, timeLimit: 20 },

  // ─── SCIENCE — HARD ───────────────────────────────────────────────────────
  { category: 'science', difficulty: 'hard', question: 'What is Avogadro\'s number?', options: ['6.022 × 10²²', '6.022 × 10²³', '6.022 × 10²⁴', '6.022 × 10²¹'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'Which particle has no electric charge?', options: ['Proton', 'Electron', 'Neutron', 'Positron'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the Heisenberg Uncertainty Principle about?', options: ['Speed of light', 'Position and momentum', 'Entropy', 'Nuclear decay'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the name of the protein that carries oxygen in red blood cells?', options: ['Myosin', 'Hemoglobin', 'Albumin', 'Keratin'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the wavelength range of visible light?', options: ['100–280 nm', '280–400 nm', '380–700 nm', '700–1000 nm'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'Which law states that energy cannot be created or destroyed?', options: ['Newton\'s Third Law', 'Ohm\'s Law', 'First Law of Thermodynamics', 'Boyle\'s Law'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the term for a solution that resists pH changes?', options: ['Catalyst', 'Solvent', 'Buffer', 'Electrolyte'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'Which element is liquid at room temperature (besides mercury)?', options: ['Bromine', 'Iodine', 'Cesium', 'Gallium'], correctAnswer: 0, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What type of bond involves sharing electrons equally?', options: ['Ionic', 'Polar covalent', 'Nonpolar covalent', 'Metallic'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the half-life concept used to measure?', options: ['Cell division', 'Radioactive decay', 'Sound attenuation', 'Light diffraction'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What does DNA stand for?', options: ['Dioxynucleic Acid', 'Deoxyribonucleic Acid', 'Dinucleic Acid', 'Deoxyribose Nucleate'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the Schwarzschild radius?', options: ['Orbit of neutron stars', 'Event horizon of a black hole', 'Radius of the Milky Way', 'Distance to the nearest star'], correctAnswer: 1, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the unit of frequency?', options: ['Pascal', 'Joule', 'Hertz', 'Tesla'], correctAnswer: 2, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'Which type of wave requires a medium to travel?', options: ['Light waves', 'Radio waves', 'Gravitational waves', 'Sound waves'], correctAnswer: 3, timeLimit: 25 },
  { category: 'science', difficulty: 'hard', question: 'What is the process by which heavier elements form inside stars?', options: ['Fission', 'Fusion nucleosynthesis', 'Radioactive decay', 'Photodisintegration'], correctAnswer: 1, timeLimit: 25 },

  // ─── HISTORY — EASY ───────────────────────────────────────────────────────
  { category: 'history', difficulty: 'easy', question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Who was the first President of the United States?', options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'In which country was the Eiffel Tower built?', options: ['Germany', 'Italy', 'France', 'Spain'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What ancient civilization built the pyramids?', options: ['Greek', 'Roman', 'Mesopotamian', 'Egyptian'], correctAnswer: 3, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Who invented the telephone?', options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Samuel Morse'], correctAnswer: 1, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What year did World War I begin?', options: ['1912', '1913', '1914', '1915'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Which country was NOT part of the Allied Powers in WWII?', options: ['USA', 'USSR', 'France', 'Germany'], correctAnswer: 3, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Who was the first man to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], correctAnswer: 1, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Which empire was Julius Caesar a ruler of?', options: ['Greek Empire', 'Ottoman Empire', 'Roman Empire', 'Persian Empire'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What was the name of the ship that sank in 1912?', options: ['Lusitania', 'Titanic', 'Bismarck', 'Britannic'], correctAnswer: 1, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Who wrote the "I Have a Dream" speech?', options: ['Malcolm X', 'Martin Luther King Jr.', 'John F. Kennedy', 'Barack Obama'], correctAnswer: 1, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What continent was Christopher Columbus trying to reach when he landed in the Americas?', options: ['Africa', 'Asia', 'Australia', 'Antarctica'], correctAnswer: 1, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'Which country had the first nuclear bomb used against it in wartime?', options: ['Germany', 'Russia', 'Japan', 'China'], correctAnswer: 2, timeLimit: 15 },
  { category: 'history', difficulty: 'easy', question: 'What was the name of Adolf Hitler\'s political party?', options: ['Fascist Party', 'Communist Party', 'Nazi Party', 'Democratic Party'], correctAnswer: 2, timeLimit: 15 },

  // ─── HISTORY — MEDIUM ─────────────────────────────────────────────────────
  { category: 'history', difficulty: 'medium', question: 'Which ancient wonder of the world was located in Alexandria?', options: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Hanging Gardens', 'Temple of Artemis'], correctAnswer: 1, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Who was the first female Prime Minister of the UK?', options: ['Queen Elizabeth II', 'Margaret Thatcher', 'Theresa May', 'Indira Gandhi'], correctAnswer: 1, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'The Cuban Missile Crisis occurred in what year?', options: ['1960', '1961', '1962', '1963'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Which country invented gunpowder?', options: ['India', 'Persia', 'China', 'Arabia'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Who was the last Pharaoh of ancient Egypt?', options: ['Cleopatra VII', 'Nefertiti', 'Ramesses II', 'Tutankhamun'], correctAnswer: 0, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'The Magna Carta was signed in what year?', options: ['1215', '1315', '1415', '1515'], correctAnswer: 0, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Which revolution occurred in France in 1789?', options: ['Industrial Revolution', 'Cultural Revolution', 'French Revolution', 'Glorious Revolution'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'What was the first country to give women the right to vote?', options: ['USA', 'UK', 'France', 'New Zealand'], correctAnswer: 3, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Who discovered penicillin?', options: ['Louis Pasteur', 'Robert Koch', 'Alexander Fleming', 'Edward Jenner'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'What was the name of Napoleon\'s final defeat?', options: ['Battle of Austerlitz', 'Battle of Waterloo', 'Battle of Trafalgar', 'Battle of Leipzig'], correctAnswer: 1, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Which city was the capital of the Byzantine Empire?', options: ['Rome', 'Athens', 'Constantinople', 'Alexandria'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'What caused the Great Famine of Ireland in the 1840s?', options: ['Drought', 'Potato blight', 'War', 'Earthquake'], correctAnswer: 1, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'Who led the Soviet Union during World War II?', options: ['Lenin', 'Trotsky', 'Khrushchev', 'Stalin'], correctAnswer: 3, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'What year did the United States declare independence?', options: ['1774', '1775', '1776', '1777'], correctAnswer: 2, timeLimit: 20 },
  { category: 'history', difficulty: 'medium', question: 'What empire did Genghis Khan found?', options: ['Ottoman Empire', 'Mongol Empire', 'Persian Empire', 'Ming Dynasty'], correctAnswer: 1, timeLimit: 20 },

  // ─── HISTORY — HARD ───────────────────────────────────────────────────────
  { category: 'history', difficulty: 'hard', question: 'The Battle of Thermopylae was fought between which two forces?', options: ['Rome and Carthage', 'Greece and Persia', 'Athens and Sparta', 'Egypt and Greece'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Who was the first Holy Roman Emperor?', options: ['Frederick Barbarossa', 'Otto I', 'Charlemagne', 'Charles V'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'In what year did the Ottoman Empire fall?', options: ['1918', '1920', '1922', '1924'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'What was the name of the policy of separating races in South Africa?', options: ['Segregation', 'Apartheid', 'Imperialism', 'Colonialism'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Which treaty ended World War I?', options: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Brest-Litovsk', 'Treaty of Vienna'], correctAnswer: 0, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Who was the Aztec emperor when Hernan Cortes arrived?', options: ['Atahualpa', 'Cuauhtémoc', 'Montezuma II', 'Itzcoatl'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'The Peloponnesian War was fought between which city-states?', options: ['Rome and Carthage', 'Athens and Sparta', 'Corinth and Thebes', 'Macedonia and Persia'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'What was the first permanent English settlement in America?', options: ['Plymouth', 'Roanoke', 'Jamestown', 'Boston'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Who wrote "The Prince" (a political treatise)?', options: ['Thomas Hobbes', 'Niccolo Machiavelli', 'John Locke', 'Jean-Jacques Rousseau'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'In what year was the Edict of Milan issued, granting religious tolerance?', options: ['253 AD', '313 AD', '380 AD', '410 AD'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Which Chinese dynasty built most of the Great Wall?', options: ['Han Dynasty', 'Tang Dynasty', 'Ming Dynasty', 'Qin Dynasty'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'What was the League of Nations replaced by?', options: ['NATO', 'European Union', 'United Nations', 'World Trade Organization'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'Who was the last Russian Tsar?', options: ['Alexander III', 'Nicholas II', 'Alexander II', 'Peter the Great'], correctAnswer: 1, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'What was the name of the first artificial satellite launched into space?', options: ['Vostok', 'Apollo', 'Sputnik', 'Explorer'], correctAnswer: 2, timeLimit: 25 },
  { category: 'history', difficulty: 'hard', question: 'The Thirty Years War primarily took place in which region?', options: ['France', 'Central Europe', 'Scandinavia', 'Italy'], correctAnswer: 1, timeLimit: 25 },

  // ─── POP CULTURE — EASY ───────────────────────────────────────────────────
  { category: 'pop_culture', difficulty: 'easy', question: 'Which movie won the Academy Award for Best Picture in 2020?', options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Who sang "Shape of You"?', options: ['Ed Sheeran', 'Justin Bieber', 'Bruno Mars', 'The Weeknd'], correctAnswer: 0, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Which fictional wizard lives at 4 Privet Drive?', options: ['Gandalf', 'Merlin', 'Harry Potter', 'Albus Dumbledore'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What is the name of the lion in "The Lion King"?', options: ['Leo', 'Mufasa', 'Simba', 'Nala'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Which band performed "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Rolling Stones'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What streaming service is known for "Stranger Things"?', options: ['Hulu', 'Disney+', 'HBO Max', 'Netflix'], correctAnswer: 3, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Who plays Iron Man in the MCU?', options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], correctAnswer: 1, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What is the best-selling video game of all time?', options: ['GTA V', 'Call of Duty', 'Minecraft', 'Tetris'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Which singer is known as "Queen Bey"?', options: ['Rihanna', 'Lady Gaga', 'Adele', 'Beyoncé'], correctAnswer: 3, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What color is Pikachu?', options: ['Red', 'Blue', 'Green', 'Yellow'], correctAnswer: 3, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'In "Friends," what is the name of Ross\'s pet monkey?', options: ['Marcel', 'Bubbles', 'Koko', 'Coco'], correctAnswer: 0, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What fictional city does Batman protect?', options: ['Metropolis', 'Central City', 'Gotham City', 'Star City'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Who wrote the "Harry Potter" series?', options: ['Stephenie Meyer', 'J.K. Rowling', 'C.S. Lewis', 'Philip Pullman'], correctAnswer: 1, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'Which Disney movie features the song "Let It Go"?', options: ['Moana', 'Brave', 'Frozen', 'Tangled'], correctAnswer: 2, timeLimit: 15 },
  { category: 'pop_culture', difficulty: 'easy', question: 'What is the name of Sherlock Holmes\'s sidekick?', options: ['Watson', 'Moriarty', 'Lestrade', 'Hudson'], correctAnswer: 0, timeLimit: 15 },

  // ─── POP CULTURE — MEDIUM ─────────────────────────────────────────────────
  { category: 'pop_culture', difficulty: 'medium', question: 'In which TV series would you find the character Walter White?', options: ['Better Call Saul', 'Breaking Bad', 'The Wire', 'Dexter'], correctAnswer: 1, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Which actor played Jack Sparrow in "Pirates of the Caribbean"?', options: ['Brad Pitt', 'Johnny Depp', 'Orlando Bloom', 'Keira Knightley'], correctAnswer: 1, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What is the name of the coffee shop in "Friends"?', options: ['The Brew House', 'Central Perk', 'Java Hut', 'Coffee Corner'], correctAnswer: 1, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Which rapper\'s real name is Aubrey Drake Graham?', options: ['Jay-Z', 'Kanye West', 'Drake', 'Lil Wayne'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'How many Infinity Stones are there in the MCU?', options: ['4', '5', '6', '7'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What TV show features the Iron Throne?', options: ['Vikings', 'The Witcher', 'Game of Thrones', 'The Last Kingdom'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Who directed "Pulp Fiction"?', options: ['Steven Spielberg', 'Martin Scorsese', 'Christopher Nolan', 'Quentin Tarantino'], correctAnswer: 3, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Which video game series features Master Chief?', options: ['Gears of War', 'Halo', 'Call of Duty', 'Destiny'], correctAnswer: 1, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What is the highest-grossing film of all time (adjusted for inflation)?', options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Gone with the Wind'], correctAnswer: 3, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Which artist painted "The Starry Night"?', options: ['Pablo Picasso', 'Claude Monet', 'Vincent van Gogh', 'Salvador Dalí'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What are BTS fans called?', options: ['Blinks', 'Army', 'Swifties', 'Beliebers'], correctAnswer: 1, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Which platform is known for short-form videos and TikTok was inspired by?', options: ['Vine', 'Instagram Reels', 'YouTube Shorts', 'Snapchat Stories'], correctAnswer: 0, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'Who plays Daenerys Targaryen in "Game of Thrones"?', options: ['Sophie Turner', 'Natalie Dormer', 'Emilia Clarke', 'Maisie Williams'], correctAnswer: 2, timeLimit: 20 },
  { category: 'pop_culture', difficulty: 'medium', question: 'What is the name of the fictional country in "Black Panther"?', options: ['Sokovia', 'Wakanda', 'Genosha', 'Latveria'], correctAnswer: 1, timeLimit: 20 },

  // ─── POP CULTURE — HARD ───────────────────────────────────────────────────
  { category: 'pop_culture', difficulty: 'hard', question: 'What was the first feature-length animated film ever released?', options: ['Bambi', 'Pinocchio', 'Snow White and the Seven Dwarfs', 'Fantasia'], correctAnswer: 2, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'In "The Dark Knight," who plays the Joker?', options: ['Jack Nicholson', 'Jared Leto', 'Heath Ledger', 'Joaquin Phoenix'], correctAnswer: 2, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What is the highest note Mariah Carey has publicly hit?', options: ['G7', 'B6', 'G#7', 'E7'], correctAnswer: 2, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Which 90s grunge band was Kurt Cobain the frontman of?', options: ['Pearl Jam', 'Soundgarden', 'Alice in Chains', 'Nirvana'], correctAnswer: 3, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Who composed the score for the original "Star Wars" trilogy?', options: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Danny Elfman'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What literary work is the TV show "Westworld" based on?', options: ['A novel by Isaac Asimov', 'A 1973 film by Michael Crichton', 'A Philip K. Dick short story', 'A novel by Arthur C. Clarke'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Which Coen Brothers film won Best Picture at the 2008 Oscars?', options: ['Fargo', 'True Grit', 'No Country for Old Men', 'Burn After Reading'], correctAnswer: 2, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What is the name of the deep AI computer in "2001: A Space Odyssey"?', options: ['HAL 9000', 'WOPR', 'Skynet', 'AM'], correctAnswer: 0, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Which musician has won the most Grammy Awards ever?', options: ['Beyoncé', 'Georg Solti', 'Alison Krauss', 'Quincy Jones'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Which video game holds the record for the most speedrun categories?', options: ['The Legend of Zelda', 'Super Mario 64', 'Dark Souls', 'Portal'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What was the first video game to be preserved by the Library of Congress?', options: ['Pac-Man', 'Pong', 'Spacewar!', 'Donkey Kong'], correctAnswer: 2, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What novel does the film "Blade Runner" draw from?', options: ['Fahrenheit 451', 'Do Androids Dream of Electric Sheep?', 'I, Robot', 'Neuromancer'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Who was the showrunner of the final season of "Game of Thrones"?', options: ['David Benioff and D.B. Weiss', 'George R.R. Martin', 'Bryan Cogman', 'Miguel Sapochnik'], correctAnswer: 0, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'Which artist did Taylor Swift have a famous feud with over music masters?', options: ['Kanye West', 'Scooter Braun', 'Scott Borchetta', 'Simon Cowell'], correctAnswer: 1, timeLimit: 25 },
  { category: 'pop_culture', difficulty: 'hard', question: 'What is the fictional programming language used in the TV show "Mr. Robot"?', options: ['Perl', 'Python', 'No real language — fictional', 'Ruby'], correctAnswer: 2, timeLimit: 25 },

  // ─── SPORTS — EASY ────────────────────────────────────────────────────────
  { category: 'sports', difficulty: 'easy', question: 'How many players are on a basketball team on the court at one time?', options: ['4', '5', '6', '7'], correctAnswer: 1, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'How many points is a touchdown worth in American football?', options: ['3', '6', '7', '8'], correctAnswer: 1, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What sport is played at Wimbledon?', options: ['Golf', 'Cricket', 'Tennis', 'Squash'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'How many players are on a soccer team on the field?', options: ['9', '10', '11', '12'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What color belt is the highest rank in judo?', options: ['Brown', 'Red', 'Black', 'Purple'], correctAnswer: 1, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'How often are the Summer Olympics held?', options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What sport does LeBron James play?', options: ['Baseball', 'Football', 'Basketball', 'Soccer'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'How many holes are in a standard round of golf?', options: ['9', '12', '18', '24'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What is the national sport of Japan?', options: ['Karate', 'Judo', 'Sumo', 'Baseball'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What sport uses a puck?', options: ['Field hockey', 'Ice hockey', 'Lacrosse', 'Polo'], correctAnswer: 1, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'In which sport is a "slam dunk" performed?', options: ['Volleyball', 'Tennis', 'Basketball', 'Baseball'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What country does soccer superstar Lionel Messi come from?', options: ['Brazil', 'Spain', 'Argentina', 'Uruguay'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'What sport does Serena Williams play?', options: ['Golf', 'Tennis', 'Badminton', 'Squash'], correctAnswer: 1, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'How many innings are in a standard baseball game?', options: ['7', '8', '9', '10'], correctAnswer: 2, timeLimit: 15 },
  { category: 'sports', difficulty: 'easy', question: 'In boxing, how long is a standard round?', options: ['2 minutes', '3 minutes', '4 minutes', '5 minutes'], correctAnswer: 1, timeLimit: 15 },

  // ─── SPORTS — MEDIUM ──────────────────────────────────────────────────────
  { category: 'sports', difficulty: 'medium', question: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Argentina', 'Brazil', 'Italy'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Who holds the record for most Grand Slam tennis titles (men)?', options: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Andy Murray'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Which NBA team has won the most championships?', options: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors'], correctAnswer: 1, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'In which sport would you perform a "butterfly stroke"?', options: ['Athletics', 'Cycling', 'Swimming', 'Gymnastics'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'What is the highest score for a single break in snooker?', options: ['147', '155', '167', '182'], correctAnswer: 0, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'How many players are in a volleyball team on the court?', options: ['4', '5', '6', '7'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Who won the most Formula 1 World Championships?', options: ['Michael Schumacher', 'Ayrton Senna', 'Lewis Hamilton', 'Sebastian Vettel'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'At what height is a basketball hoop placed (in feet)?', options: ['8', '9', '10', '11'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Which country hosted the 2016 Summer Olympics?', options: ['China', 'UK', 'Brazil', 'Japan'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'What is the distance of a marathon in kilometers?', options: ['38.5 km', '40 km', '42.195 km', '45 km'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'In tennis, what is the term for when a player wins a set 6-0?', options: ['Whitewash', 'Bagel', 'Breadstick', 'Grand Slam'], correctAnswer: 1, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Who scored the most goals in a single FIFA World Cup tournament?', options: ['Gerd Müller', 'Ronaldo', 'Just Fontaine', 'Pelé'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'What sport is played at the US Masters tournament?', options: ['Tennis', 'Golf', 'Polo', 'Cricket'], correctAnswer: 1, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'In American football, how many points is a field goal worth?', options: ['1', '2', '3', '4'], correctAnswer: 2, timeLimit: 20 },
  { category: 'sports', difficulty: 'medium', question: 'Which country invented basketball?', options: ['USA', 'Canada', 'UK', 'Australia'], correctAnswer: 1, timeLimit: 20 },

  // ─── SPORTS — HARD ────────────────────────────────────────────────────────
  { category: 'sports', difficulty: 'hard', question: 'In tennis, what is the maximum number of sets in a Grand Slam men\'s match?', options: ['3', '4', '5', '6'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What is the "Fosbury Flop" in athletics?', options: ['High jump technique', 'Long jump technique', 'Pole vault technique', 'Shot put technique'], correctAnswer: 0, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'Who has scored the most points in NBA history?', options: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Kareem Abdul-Jabbar'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What is the Elo rating system used for in chess?', options: ['Game time management', 'Piece value calculation', 'Player strength rating', 'Tournament seeding'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'In cricket, what is a "duck"?', options: ['Fielding position', 'Scoring zero runs', 'Wide ball', 'Batting technique'], correctAnswer: 1, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'Which swimmer won the most Olympic gold medals in a single Olympics?', options: ['Ian Thorpe', 'Mark Spitz', 'Michael Phelps', 'Ryan Lochte'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What is the name of the starting position in Formula 1 that guarantees front-row placement?', options: ['Pole position', 'Grid position', 'Hot lap', 'Fast lap'], correctAnswer: 0, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'Who holds the world record for the 100m sprint?', options: ['Justin Gatlin', 'Tyson Gay', 'Usain Bolt', 'Yohan Blake'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What year were women first allowed to compete in the Olympic marathon?', options: ['1972', '1976', '1980', '1984'], correctAnswer: 3, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'In rugby union, how many players are in a scrum per team?', options: ['6', '7', '8', '9'], correctAnswer: 2, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What is the name for a horse that has never won a race?', options: ['Maiden', 'Novice', 'Yearling', 'Starter'], correctAnswer: 0, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'How many times can a tennis player serve in one point?', options: ['1', '2', '3', 'Unlimited'], correctAnswer: 1, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'What term describes a perfect score in a single game of bowling?', options: ['Ace', 'Perfect 300', 'Golden Strike', 'Grand Slam'], correctAnswer: 1, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'In cycling, what is the Tour de France\'s final stage traditionally held in?', options: ['Paris', 'Lyon', 'Nice', 'Bordeaux'], correctAnswer: 0, timeLimit: 25 },
  { category: 'sports', difficulty: 'hard', question: 'Which country won the first ever FIFA World Cup in 1930?', options: ['Brazil', 'Argentina', 'Uruguay', 'Italy'], correctAnswer: 2, timeLimit: 25 },

  // ─── GEOGRAPHY — EASY ─────────────────────────────────────────────────────
  { category: 'geography', difficulty: 'easy', question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'Which is the largest continent?', options: ['Africa', 'Europe', 'Asia', 'South America'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'Which country is the Great Wall located in?', options: ['Japan', 'South Korea', 'China', 'Vietnam'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'], correctAnswer: 3, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the smallest country in the world?', options: ['Monaco', 'Nauru', 'Vatican City', 'San Marino'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correctAnswer: 1, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'Which country is home to the Amazon rainforest (mostly)?', options: ['Colombia', 'Venezuela', 'Peru', 'Brazil'], correctAnswer: 3, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the tallest mountain in the world?', options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'Which country is known as the Land of the Rising Sun?', options: ['China', 'Japan', 'South Korea', 'Vietnam'], correctAnswer: 1, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'Which country has the most natural lakes?', options: ['USA', 'Russia', 'Canada', 'Finland'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'On which continent is Egypt located?', options: ['Asia', 'Europe', 'Africa', 'Middle East'], correctAnswer: 2, timeLimit: 15 },
  { category: 'geography', difficulty: 'easy', question: 'What is the largest desert in the world?', options: ['Sahara', 'Gobi', 'Antarctic', 'Arabian'], correctAnswer: 2, timeLimit: 15 },

  // ─── GEOGRAPHY — MEDIUM ───────────────────────────────────────────────────
  { category: 'geography', difficulty: 'medium', question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Which river flows through Egypt?', options: ['Amazon', 'Congo', 'Nile', 'Niger'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the largest country in South America by area?', options: ['Argentina', 'Brazil', 'Peru', 'Colombia'], correctAnswer: 1, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Which sea separates Europe from Africa?', options: ['Red Sea', 'Black Sea', 'Mediterranean Sea', 'Caspian Sea'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Baht'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Which country has the most time zones?', options: ['Russia', 'USA', 'China', 'Australia'], correctAnswer: 0, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the second largest continent by area?', options: ['North America', 'Antarctica', 'Africa', 'Europe'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Which country is home to Machu Picchu?', options: ['Colombia', 'Ecuador', 'Peru', 'Bolivia'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the deepest lake in the world?', options: ['Lake Superior', 'Caspian Sea', 'Lake Baikal', 'Lake Tanganyika'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the longest mountain range in the world?', options: ['Himalayas', 'Rockies', 'Alps', 'Andes'], correctAnswer: 3, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Which island is the world\'s largest?', options: ['Borneo', 'Madagascar', 'Greenland', 'New Guinea'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What country contains the most of the Sahara Desert?', options: ['Egypt', 'Libya', 'Algeria', 'Sudan'], correctAnswer: 2, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'What is the capital of South Africa?', options: ['Johannesburg', 'Cape Town', 'Pretoria', 'There are three capitals'], correctAnswer: 3, timeLimit: 20 },
  { category: 'geography', difficulty: 'medium', question: 'Through how many countries does the Danube River flow?', options: ['5', '7', '8', '10'], correctAnswer: 3, timeLimit: 20 },

  // ─── GEOGRAPHY — HARD ─────────────────────────────────────────────────────
  { category: 'geography', difficulty: 'hard', question: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Nur-Sultan (Astana)', 'Shymkent', 'Karaganda'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the only country to share a border with both Norway and Russia?', options: ['Sweden', 'Finland', 'Estonia', 'Latvia'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'Which country has the most coastline in the world?', options: ['Australia', 'Russia', 'Norway', 'Canada'], correctAnswer: 3, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the name of the deepest point in the ocean?', options: ['Tonga Trench', 'Puerto Rico Trench', 'Challenger Deep', 'Mariana Trench'], correctAnswer: 2, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the smallest country in Africa by area?', options: ['Djibouti', 'Seychelles', 'Comoros', 'São Tomé and Príncipe'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'Which African country was formerly known as Rhodesia?', options: ['Zambia', 'Mozambique', 'Zimbabwe', 'Tanzania'], correctAnswer: 2, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the name of the strait that separates Spain and Morocco?', options: ['Strait of Hormuz', 'Strait of Malacca', 'Strait of Gibraltar', 'Strait of Messina'], correctAnswer: 2, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'Which country has the most active volcanoes?', options: ['Japan', 'Indonesia', 'USA', 'Iceland'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the highest navigable lake in the world?', options: ['Lake Titicaca', 'Lake Baikal', 'Lake Tahoe', 'Crater Lake'], correctAnswer: 0, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'How many landlocked countries are in Africa?', options: ['12', '14', '16', '18'], correctAnswer: 2, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the world\'s largest archipelago nation?', options: ['Philippines', 'Indonesia', 'Japan', 'Maldives'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'Which country is entirely surrounded by South Africa?', options: ['Swaziland/Eswatini', 'Lesotho', 'Botswana', 'Namibia'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the capital of Bhutan?', options: ['Kathmandu', 'Thimphu', 'Paro', 'Punakha'], correctAnswer: 1, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'The Atacama Desert is found in which continent?', options: ['Africa', 'Asia', 'South America', 'Australia'], correctAnswer: 2, timeLimit: 25 },
  { category: 'geography', difficulty: 'hard', question: 'What is the name of the sea between Australia and New Zealand?', options: ['Coral Sea', 'Tasman Sea', 'Arafura Sea', 'Solomon Sea'], correctAnswer: 1, timeLimit: 25 },

  // ─── GENERAL KNOWLEDGE — EASY ─────────────────────────────────────────────
  { category: 'general', difficulty: 'easy', question: 'How many days are there in a week?', options: ['5', '6', '7', '8'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'How many months are in a year?', options: ['10', '11', '12', '13'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'How many letters are in the English alphabet?', options: ['24', '25', '26', '27'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is the largest mammal in the world?', options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], correctAnswer: 1, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is 7 × 8?', options: ['54', '56', '58', '64'], correctAnswer: 1, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'Which animal is known as the "King of the Jungle"?', options: ['Tiger', 'Cheetah', 'Lion', 'Gorilla'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What color is a banana?', options: ['Orange', 'Red', 'Yellow', 'Green'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], correctAnswer: 1, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is the opposite of "hot"?', options: ['Warm', 'Cool', 'Cold', 'Chilly'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What do bees produce?', options: ['Milk', 'Wax only', 'Honey', 'Silk'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is the fastest land animal?', options: ['Lion', 'Leopard', 'Cheetah', 'Horse'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What language has the most native speakers in the world?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is the primary ingredient in bread?', options: ['Sugar', 'Salt', 'Flour', 'Butter'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'How many minutes are in an hour?', options: ['50', '55', '60', '65'], correctAnswer: 2, timeLimit: 15 },
  { category: 'general', difficulty: 'easy', question: 'What is the tallest land animal?', options: ['Elephant', 'Camel', 'Horse', 'Giraffe'], correctAnswer: 3, timeLimit: 15 },

  // ─── GENERAL KNOWLEDGE — MEDIUM ───────────────────────────────────────────
  { category: 'general', difficulty: 'medium', question: 'What element has the atomic number 1?', options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'How many stripes are on the US flag?', options: ['11', '12', '13', '14'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the longest bone in the human body?', options: ['Tibia', 'Humerus', 'Femur', 'Spine'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What type of angle is exactly 90 degrees?', options: ['Acute', 'Obtuse', 'Right', 'Straight'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'In what decade was the internet (World Wide Web) invented?', options: ['1970s', '1980s', '1990s', '2000s'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'How many colors are in a rainbow?', options: ['5', '6', '7', '8'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'Who wrote "Pride and Prejudice"?', options: ['Charlotte Brontë', 'Emily Brontë', 'Jane Austen', 'Mary Shelley'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the most traded commodity in the world?', options: ['Gold', 'Coffee', 'Crude Oil', 'Wheat'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the chemical symbol for silver?', options: ['Si', 'Ag', 'Sr', 'Sv'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the collective noun for a group of crows?', options: ['Flock', 'Murder', 'Colony', 'Pack'], correctAnswer: 1, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'How many teeth does an adult human have (including wisdom teeth)?', options: ['28', '30', '32', '34'], correctAnswer: 2, timeLimit: 20 },
  { category: 'general', difficulty: 'medium', question: 'What is the most common blood type?', options: ['AB+', 'B+', 'A+', 'O+'], correctAnswer: 3, timeLimit: 20 },

  // ─── GENERAL KNOWLEDGE — HARD ─────────────────────────────────────────────
  { category: 'general', difficulty: 'hard', question: 'What is the Dunning-Kruger effect?', options: ['Memory decay theory', 'Cognitive bias about overestimating competence', 'Social conformity bias', 'Pattern recognition error'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the name of the logical paradox: "This statement is false"?', options: ['Zeno\'s paradox', 'Liar\'s paradox', 'Russell\'s paradox', 'Barber paradox'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the Fibonacci sequence\'s 10th number?', options: ['34', '55', '89', '144'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the study of flags called?', options: ['Vexillography', 'Heraldry', 'Vexillology', 'Sigillography'], correctAnswer: 2, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the name of the hypothetical point inside a black hole?', options: ['Event horizon', 'Singularity', 'Photon sphere', 'Accretion disk'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'Who proved that there are different sizes of infinity?', options: ['Euclid', 'Georg Cantor', 'David Hilbert', 'Kurt Gödel'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the most precisely measured physical constant?', options: ['Speed of light', 'Gravitational constant', 'Fine-structure constant', 'Boltzmann constant'], correctAnswer: 2, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the rarest blood type?', options: ['AB-', 'B-', 'A-', 'O-'], correctAnswer: 0, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the term for a word that reads the same forward and backward?', options: ['Anagram', 'Palindrome', 'Homophone', 'Oxymoron'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the name of the theorem stating that no simple proof exists for Fermat\'s Last Theorem?', options: ['There is no such theorem', 'Wiles\'s Theorem', 'The theorem is simply called Fermat\'s Last Theorem', 'The incompleteness theorem'], correctAnswer: 2, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'Which metal is liquid at room temperature?', options: ['Lead', 'Tin', 'Mercury', 'Cesium'], correctAnswer: 2, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the Voynich manuscript?', options: ['A lost Shakespeare play', 'An undeciphered illustrated codex', 'An ancient tax document', 'A medieval medical text'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What is the mathematical term for the ratio of a circle\'s circumference to its diameter?', options: ['Euler\'s number', 'Golden ratio', 'Pi', 'Planck\'s constant'], correctAnswer: 2, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'What does the term "quantum entanglement" describe?', options: ['Particles sharing space', 'Correlated particles regardless of distance', 'Wave-particle duality', 'Quantum tunneling'], correctAnswer: 1, timeLimit: 25 },
  { category: 'general', difficulty: 'hard', question: 'Who formulated the theory of general relativity?', options: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Max Planck'], correctAnswer: 2, timeLimit: 25 },
];

export class QuestionBank {
  private questions: QuestionData[];
  private usedQuestionIds: Set<string> = new Set();

  constructor() {
    this.questions = [...questionBank];
  }

  getRandomQuestion(category?: string, difficulty?: string, excludeIds?: string[]): Question | null {
    let filteredQuestions = this.questions;

    if (category && category !== 'general') {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }

    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    // Exclude already-used questions in this match session
    // IDs are stable (no random suffix), so the comparison is exact
    if (excludeIds && excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds);
      const unused = filteredQuestions.filter(q => {
        const id = `${q.category}_${q.difficulty}_${q.question.substring(0, 30)}`;
        return !excludeSet.has(id);
      });
      // Only use unused questions if available; otherwise allow repeats
      if (unused.length > 0) {
        filteredQuestions = unused;
      }
    }

    if (filteredQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const questionData = filteredQuestions[randomIndex];
    // Stable, deterministic ID — no random suffix so history dedup works correctly
    const id = `${questionData.category}_${questionData.difficulty}_${questionData.question.substring(0, 30)}`;

    return {
      id,
      ...questionData
    };
  }

  getQuestionsByCategory(category: string, count: number = 10): Question[] {
    const categoryQuestions = this.questions.filter(q => q.category === category);
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count).map(questionData => ({
      id: `${questionData.category}_${questionData.difficulty}_${questionData.question.substring(0, 20)}_${Math.random().toString(36).substr(2, 5)}`,
      ...questionData
    }));
  }

  getQuestionsByDifficulty(difficulty: string, count: number = 10): Question[] {
    const difficultyQuestions = this.questions.filter(q => q.difficulty === difficulty);
    const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count).map(questionData => ({
      id: `${questionData.category}_${questionData.difficulty}_${questionData.question.substring(0, 20)}_${Math.random().toString(36).substr(2, 5)}`,
      ...questionData
    }));
  }

  getTotalCount(): number {
    return this.questions.length;
  }
}
