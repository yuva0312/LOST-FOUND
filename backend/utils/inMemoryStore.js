/**
 * Centralized in-memory store for development mode when MongoDB is not connected.
 * Preserves reported lost items, found items, claims, and notifications across request routes.
 */

const inMemoryLostItems = [];

const inMemoryFoundItems = [
  {
    _id: 'found_demo_01',
    reportedBy: 'demo_user_1',
    itemName: 'Black Stainless Steel Water Bottle',
    category: 'Bottle',
    location: 'Central Library',
    specificLocation: '2nd Floor Reading Desk 4',
    foundDate: new Date(Date.now() - 360000000),
    foundTime: '02:30 PM',
    timeRange: '02:00 PM - 03:00 PM',
    brand: 'Milton',
    colour: 'Black',
    uniqueMark: 'Scratched base and blue sticker',
    specialFeature: 'Insulated cap',
    damage: 'Minor scratches at bottom',
    privateDescription: 'Has student initials written on bottom',
    imageUrl: '',
    status: 'reported',
    createdAt: new Date(Date.now() - 360000000),
    updatedAt: new Date(Date.now() - 360000000),
  },
  {
    _id: 'found_demo_02',
    reportedBy: 'demo_user_2',
    itemName: 'College Student ID Card',
    category: 'ID Card',
    location: 'Main Auditorium',
    specificLocation: 'Row G Seat 12',
    foundDate: new Date(Date.now() - 180000000),
    foundTime: '11:15 AM',
    timeRange: '11:00 AM - 12:00 PM',
    brand: 'Campus ID',
    colour: 'White/Blue',
    uniqueMark: 'CS Department lanyard attached',
    specialFeature: 'Photo visible',
    damage: 'None',
    privateDescription: 'Student ID number on reverse side',
    imageUrl: '',
    status: 'reported',
    createdAt: new Date(Date.now() - 180000000),
    updatedAt: new Date(Date.now() - 180000000),
  },
  {
    _id: 'found_demo_03',
    reportedBy: 'demo_user_3',
    itemName: 'Analog Wrist Watch',
    category: 'Watch',
    location: 'College Canteen',
    specificLocation: 'Table near counter',
    foundDate: new Date(Date.now() - 90000000),
    foundTime: '04:00 PM',
    timeRange: '03:30 PM - 04:30 PM',
    brand: 'Casio',
    colour: 'Silver / Black',
    uniqueMark: 'Leather strap with silver dial',
    specialFeature: 'Water resistant logo on back',
    damage: 'Small hairline scratch on glass',
    privateDescription: 'Engraved initials on watch case back',
    imageUrl: '',
    status: 'reported',
    createdAt: new Date(Date.now() - 90000000),
    updatedAt: new Date(Date.now() - 90000000),
  },
];

const inMemoryClaims = [];
const inMemoryNotifications = [];

module.exports = {
  inMemoryLostItems,
  inMemoryFoundItems,
  inMemoryClaims,
  inMemoryNotifications,
};
