const fs = require('fs');
const path = require('path');
const https = require('https');
const { createCanvas } = require('canvas');

// Create character assets directory if it doesn't exist
const assetDir = path.join(__dirname, '../assets/character');
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir, { recursive: true });
}

// Function to generate a placeholder image when we can't fetch one
function generatePlaceholderImage(name, category, id) {
  const width = 400;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Get initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Background color based on category
  const colorMap = {
    'fantasy': '#673AB7',
    'historical': '#E64A19',
    'professional': '#1976D2',
    'fictional': '#388E3C',
    'anime': '#D81B60',
    'celebrity': '#FFA000',
    'scientists': '#0097A7'
  };

  const bgColor = colorMap[category.toLowerCase()] || '#607D8B';

  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Draw initials
  ctx.fillStyle = 'white';
  ctx.font = 'bold 144px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, width / 2, height / 2);

  // Draw name and category
  ctx.font = 'bold 48px Arial';
  ctx.fillText(name.substring(0, 15), width / 2, height - 100);
  ctx.font = '32px Arial';
  ctx.fillText(category, width / 2, height - 50);

  // Save the image
  const filename = path.join(assetDir, `${id}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  
  console.log(`Generated placeholder image for ${name} (${category})`);
  return filename;
}

// For a real app, we would use image URLs, but for this example we'll just generate placeholders
// This function simulates downloading an image from a URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    // In a real app, we would download from the URL
    // For this example, we'll just resolve immediately
    resolve(filename);
    
    /* Actual download code would be:
    const file = fs.createWriteStream(filename);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
    }).on('error', err => {
      fs.unlink(filename);
      reject(err);
    });
    */
  });
}

// Main function to create character images
async function generateCharacterImages() {
  const characters = [
    // Fantasy Characters
    {
      id: 'fantasy1',
      name: 'Gandalf',
      category: 'Fantasy',
      image: 'fantasy/gandalf.png'
    },
    {
      id: 'fantasy2',
      name: 'Daenerys Targaryen',
      category: 'Fantasy',
      image: 'fantasy/daenerys.png'
    },
    {
      id: 'fantasy3',
      name: 'Harry Potter',
      category: 'Fantasy',
      image: 'fantasy/harry.png'
    },
    {
      id: 'fantasy4',
      name: 'Aragorn',
      category: 'Fantasy',
      image: 'fantasy/aragorn.png'
    },
    {
      id: 'fantasy5',
      name: 'Galadriel',
      category: 'Fantasy',
      image: 'fantasy/galadriel.png'
    },
    
    // Historical Figures
    {
      id: 'historical1',
      name: 'Cleopatra',
      category: 'Historical',
      image: 'historical/cleopatra.png'
    },
    {
      id: 'historical2',
      name: 'Julius Caesar',
      category: 'Historical',
      image: 'historical/caesar.png'
    },
    {
      id: 'historical3',
      name: 'Leonardo da Vinci',
      category: 'Historical',
      image: 'historical/davinci.png'
    },
    {
      id: 'historical4',
      name: 'Marie Antoinette',
      category: 'Historical',
      image: 'historical/antoinette.png'
    },
    {
      id: 'historical5',
      name: 'Genghis Khan',
      category: 'Historical',
      image: 'historical/genghis.png'
    },
    
    // Professional Types
    {
      id: 'professional1',
      name: 'Dr. Sarah Chen',
      category: 'Professional',
      image: 'professional/doctor.png'
    },
    {
      id: 'professional2',
      name: 'Prof. James Wilson',
      category: 'Professional',
      image: 'professional/professor.png'
    },
    {
      id: 'professional3',
      name: 'Chef Antonio',
      category: 'Professional',
      image: 'professional/chef.png'
    },
    {
      id: 'professional4',
      name: 'Detective Morgan',
      category: 'Professional',
      image: 'professional/detective.png'
    },
    {
      id: 'professional5',
      name: 'Astronaut Zhang',
      category: 'Professional',
      image: 'professional/astronaut.png'
    },
    
    // Fictional Characters
    {
      id: 'fictional1',
      name: 'Sherlock Holmes',
      category: 'Fictional',
      image: 'fictional/sherlock.png'
    },
    {
      id: 'fictional2',
      name: 'Elizabeth Bennet',
      category: 'Fictional',
      image: 'fictional/lizzy.png'
    },
    {
      id: 'fictional3',
      name: 'Jay Gatsby',
      category: 'Fictional',
      image: 'fictional/gatsby.png'
    },
    {
      id: 'fictional4',
      name: 'Atticus Finch',
      category: 'Fictional',
      image: 'fictional/atticus.png'
    },
    {
      id: 'fictional5',
      name: 'Captain Ahab',
      category: 'Fictional',
      image: 'fictional/ahab.png'
    },
    
    // Anime Characters
    {
      id: 'anime1',
      name: 'Spike Spiegel',
      category: 'Anime',
      image: 'anime/spike.png'
    },
    {
      id: 'anime2',
      name: 'Sailor Moon',
      category: 'Anime',
      image: 'anime/sailor.png'
    },
    {
      id: 'anime3',
      name: 'Goku',
      category: 'Anime',
      image: 'anime/goku.png'
    },
    {
      id: 'anime4',
      name: 'Levi Ackerman',
      category: 'Anime',
      image: 'anime/levi.png'
    },
    {
      id: 'anime5',
      name: 'Mikasa Ackerman',
      category: 'Anime',
      image: 'anime/mikasa.png'
    },
    
    // Celebrity Characters
    {
      id: 'celebrity1',
      name: 'Marilyn Monroe',
      category: 'Celebrity',
      image: 'celebrity/marilyn.png'
    },
    {
      id: 'celebrity2',
      name: 'Elvis Presley',
      category: 'Celebrity',
      image: 'celebrity/elvis.png'
    },
    {
      id: 'celebrity3',
      name: 'Audrey Hepburn',
      category: 'Celebrity',
      image: 'celebrity/audrey.png'
    },
    {
      id: 'celebrity4',
      name: 'Bruce Lee',
      category: 'Celebrity',
      image: 'celebrity/bruce.png'
    },
    {
      id: 'celebrity5',
      name: 'Frida Kahlo',
      category: 'Celebrity',
      image: 'celebrity/frida.png'
    },
    
    // Scientists
    {
      id: 'scientists1',
      name: 'Albert Einstein',
      category: 'Scientists',
      image: 'scientists/einstein.png'
    },
    {
      id: 'scientists2',
      name: 'Marie Curie',
      category: 'Scientists',
      image: 'scientists/curie.png'
    },
    {
      id: 'scientists3',
      name: 'Isaac Newton',
      category: 'Scientists',
      image: 'scientists/newton.png'
    },
    {
      id: 'scientists4',
      name: 'Nikola Tesla',
      category: 'Scientists',
      image: 'scientists/tesla.png'
    },
    {
      id: 'scientists5',
      name: 'Ada Lovelace',
      category: 'Scientists',
      image: 'scientists/lovelace.png'
    }
  ];
  
  for (const character of characters) {
    // Generate a placeholder image for each character
    const outputPath = path.join(assetDir, `${character.id}.png`);
    generatePlaceholderImage(character.name, character.category, character.id);
    
    // If we had real image URLs, we would download them:
    // await downloadImage(character.imageUrl, outputPath);
  }

  console.log('Character images generated successfully!');
}

// Execute the function
generateCharacterImages(); 