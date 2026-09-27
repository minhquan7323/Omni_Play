import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.PGDB_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Create a System Uploader user
  const uploader = await prisma.user.upsert({
    where: { email: 'system_uploader@example.com' },
    update: {},
    create: {
      email: 'system_uploader@example.com',
      fullName: 'System Uploader',
      password: 'hashed_dummy_password',
    },
  });

  console.log(`Uploader created with id: ${uploader.id}`);

  // 2. Create Artists
  const artistsData = [
    {
      name: 'The Weeknd',
      image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
      description: 'Canadian singer, songwriter, and record producer.',
    },
    {
      name: 'Daft Punk',
      image: 'https://i.scdn.co/image/ab6761610000e5eb1d2e82ce5a98059ff9eb7b3d',
      description: 'French electronic music duo.',
    },
    {
      name: 'Taylor Swift',
      image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4891b92019b8849b',
      description: 'American singer-songwriter.',
    },
    {
      name: 'Ed Sheeran',
      image: 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6',
      description: 'English singer-songwriter.',
    }
  ];

  const createdArtists: any[] = [];
  for (const artist of artistsData) {
    const createdArtist = await prisma.artist.create({
      data: artist,
    });
    createdArtists.push(createdArtist);
    console.log(`Created artist: ${createdArtist.name}`);
  }

  // 3. Create Albums
  const albumsData = [
    {
      name: 'Starboy',
      image: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
      releaseDate: new Date('2016-11-25'),
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[0].id }, // The Weeknd
          { id: createdArtists[1].id }  // Daft Punk
        ]
      }
    },
    {
      name: '1989',
      image: 'https://i.scdn.co/image/ab67616d0000b27318be79dcb61ed3e839e99a4c',
      releaseDate: new Date('2014-10-27'),
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[2].id } // Taylor Swift
        ]
      }
    },
    {
      name: '÷ (Divide)',
      image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      releaseDate: new Date('2017-03-03'),
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[3].id } // Ed Sheeran
        ]
      }
    }
  ];

  const createdAlbums: any[] = [];
  for (const album of albumsData) {
    const createdAlbum = await prisma.album.create({
      data: album,
    });
    createdAlbums.push(createdAlbum);
    console.log(`Created album: ${createdAlbum.name}`);
  }

  // 4. Create Tracks
  const tracksData = [
    {
      title: 'Starboy',
      duration: 230,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder URL
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
      albumId: createdAlbums[0].id,
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[0].id },
          { id: createdArtists[1].id }
        ]
      }
    },
    {
      title: 'I Feel It Coming',
      duration: 228,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder URL
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
      albumId: createdAlbums[0].id,
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[0].id },
          { id: createdArtists[1].id }
        ]
      }
    },
    {
      title: 'Blank Space',
      duration: 231,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder URL
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b27318be79dcb61ed3e839e99a4c',
      albumId: createdAlbums[1].id,
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[2].id }
        ]
      }
    },
    {
      title: 'Style',
      duration: 231,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder URL
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b27318be79dcb61ed3e839e99a4c',
      albumId: createdAlbums[1].id,
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[2].id }
        ]
      }
    },
    {
      title: 'Shape of You',
      duration: 233,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder URL
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      albumId: createdAlbums[2].id,
      uploaderId: uploader.id,
      artists: {
        connect: [
          { id: createdArtists[3].id }
        ]
      }
    }
  ];

  for (const track of tracksData) {
    const createdTrack = await prisma.track.create({
      data: track,
    });
    console.log(`Created track: ${createdTrack.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
