import { Role } from '@prisma/client';

export type Permission =
  | 'users.read'
  | 'users.delete'

  | 'properties.read'
  | 'properties.create'
  | 'properties.update'
  | 'properties.delete'

  | 'leads.read.all'
  | 'leads.read.own'
  | 'leads.create.manual'
  | 'leads.create.own'
  | 'leads.update'
  | 'leads.delete'

  |  'matching.read.all'
  |  'matching.read.own.buyer'
  |  'matching.read.own.professional'
  |  'matching.generate'
  |  'matching.approve'
  |  'matching.reject'
  |  'matching.contact'
  |  'matching.complete'

  | 'audit.read'

  | 'stories.read'
  | 'stories.create'
  | 'stories.approve'
  | 'stories.delete'

  | 'notifications.read'
  | 'analytics.read'

  | 'saved-properties.read'
  | 'saved-properties.create'
  | 'saved-properties.delete'


  | 'reviews.create'
  | 'reviews.read.own'
  | 'reviews.read.all'
  | 'reviews.approve'
  | 'reviews.reject'

  | 'profile.update';

  
  


export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'users.read',
    'users.delete',

    'properties.read',
    'properties.update',
    'properties.delete',

    'leads.read.all',
    'leads.update',
    'leads.delete',

    'matching.read.all',
    'matching.generate',
    'matching.approve',
    'matching.reject',
    'matching.complete',

    'audit.read',

    'stories.read',
    'stories.create',
    'stories.approve',
    'stories.delete',

    'notifications.read',
    'profile.update',
    'reviews.read.all',
    'reviews.approve',
    'reviews.reject',
    'analytics.read'
  ],

  PROFESSIONAL: [
    'properties.read',
    'properties.create',
    'properties.update',
    'properties.delete',

    'matching.read.own.professional',
    'matching.contact',
    'matching.complete',

    'stories.read',
    

    'notifications.read',
    'profile.update',
  ],

  BUYER: [
  'properties.read',

  'leads.read.own',
  'leads.create.own',

  // Le Buyer peut consulter uniquement ses propres matchs.
  'matching.read.own.buyer',

  'stories.read',
  'stories.create',

  'notifications.read',
  'profile.update',
  'saved-properties.read',
  'saved-properties.create',
  'saved-properties.delete',
  'reviews.create',
  'reviews.read.own',
],
};