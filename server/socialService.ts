import { db } from './storage';
import { playerProfiles, friendships, playerMessages, gameInvites, gameStats } from '../shared/schema';
import { PlayerProfile, Friendship, PlayerMessage, GameInvite } from '../shared/schema';
import { eq, desc, and, or } from 'drizzle-orm';

export class SocialService {
  async createOrUpdateProfile(
    playerId: string,
    displayName: string,
    bio?: string,
    avatar?: string,
    location?: string,
    favoriteCategories?: string[],
    isPublic: boolean = true
  ): Promise<PlayerProfile | null> {
    try {
      const favCatsJson = JSON.stringify(favoriteCategories || []);
      
      // Check if profile exists
      const [existingProfile] = await db.select().from(playerProfiles)
        .where(eq(playerProfiles.playerId, playerId));

      if (existingProfile) {
        // Update existing profile
        await db.update(playerProfiles)
          .set({
            displayName,
            bio,
            avatar,
            location,
            favoriteCategories: favCatsJson,
            isPublic,
            updatedAt: new Date()
          })
          .where(eq(playerProfiles.playerId, playerId));
      } else {
        // Create new profile
        await db.insert(playerProfiles)
          .values({
            playerId,
            displayName,
            bio,
            avatar,
            location,
            favoriteCategories: favCatsJson,
            isPublic,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      return await this.getProfile(playerId);
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      return null;
    }
  }

  async getProfile(playerId: string, includeStats: boolean = true): Promise<PlayerProfile | null> {
    try {
      const [profile] = await db.select().from(playerProfiles)
        .where(eq(playerProfiles.playerId, playerId));

      if (!profile) return null;

      let stats = undefined;
      if (includeStats) {
        const [playerStats] = await db.select().from(gameStats)
          .where(eq(gameStats.playerId, playerId));

        if (playerStats) {
          stats = {
            totalGames: playerStats.totalGames || 0,
            wins: playerStats.wins || 0,
            winRate: playerStats.totalGames ? Math.round((playerStats.wins || 0) / playerStats.totalGames * 100) : 0,
            bestStreak: playerStats.bestStreak || 0,
            rating: playerStats.rating || 1000,
            tier: playerStats.tier || 'bronze'
          };
        }
      }

      return {
        id: profile.id,
        playerId: profile.playerId,
        displayName: profile.displayName,
        bio: profile.bio || undefined,
        avatar: profile.avatar || undefined,
        location: profile.location || undefined,
        favoriteCategories: profile.favoriteCategories ? JSON.parse(profile.favoriteCategories) : [],
        isPublic: profile.isPublic ?? true,
        stats,
        createdAt: profile.createdAt!,
        updatedAt: profile.updatedAt!
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async searchProfiles(searchTerm: string, limit: number = 20): Promise<PlayerProfile[]> {
    try {
      const profiles = await db.select().from(playerProfiles)
        .where(eq(playerProfiles.isPublic, true))
        .limit(limit * 2); // Get more to filter

      // Simple text search (in production, use proper full-text search)
      const filteredProfiles = profiles
        .filter((profile: any) => 
          profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (profile.bio && profile.bio.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .slice(0, limit);

      const results: PlayerProfile[] = [];
      for (const profile of filteredProfiles) {
        const fullProfile = await this.getProfile(profile.playerId);
        if (fullProfile) results.push(fullProfile);
      }

      return results;
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<boolean> {
    try {
      if (requesterId === addresseeId) return false;

      // Check if friendship already exists
      const existingFriendship = await db.select().from(friendships)
        .where(or(
          and(
            eq(friendships.requesterId, requesterId),
            eq(friendships.addresseeId, addresseeId)
          ),
          and(
            eq(friendships.requesterId, addresseeId),
            eq(friendships.addresseeId, requesterId)
          )
        ));

      if (existingFriendship.length > 0) return false;

      await db.insert(friendships)
        .values({
          requesterId,
          addresseeId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }

  async respondToFriendRequest(friendshipId: number, response: 'accepted' | 'declined'): Promise<boolean> {
    try {
      await db.update(friendships)
        .set({
          status: response,
          updatedAt: new Date()
        })
        .where(eq(friendships.id, friendshipId));

      return true;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return false;
    }
  }

  async getFriends(playerId: string): Promise<PlayerProfile[]> {
    try {
      const friendshipResults = await db.select().from(friendships)
        .where(and(
          or(
            eq(friendships.requesterId, playerId),
            eq(friendships.addresseeId, playerId)
          ),
          eq(friendships.status, 'accepted')
        ));

      const friends: PlayerProfile[] = [];
      for (const friendship of friendshipResults) {
        const friendId = friendship.requesterId === playerId 
          ? friendship.addresseeId 
          : friendship.requesterId;
        
        const friendProfile = await this.getProfile(friendId);
        if (friendProfile) friends.push(friendProfile);
      }

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async getFriendRequests(playerId: string): Promise<Friendship[]> {
    try {
      const requests = await db.select().from(friendships)
        .where(and(
          eq(friendships.addresseeId, playerId),
          eq(friendships.status, 'pending')
        ));

      const result: Friendship[] = [];
      for (const request of requests) {
        const requesterProfile = await this.getProfile(request.requesterId);
        result.push({
          id: request.id,
          requesterId: request.requesterId,
          addresseeId: request.addresseeId,
          status: request.status as 'pending' | 'accepted' | 'declined' | 'blocked',
          createdAt: request.createdAt!,
          updatedAt: request.updatedAt!,
          requesterProfile: requesterProfile || undefined
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }

  async sendMessage(senderId: string, recipientId: string, message: string): Promise<PlayerMessage | null> {
    try {
      // Check if users are friends
      const friendship = await db.select().from(friendships)
        .where(and(
          or(
            and(
              eq(friendships.requesterId, senderId),
              eq(friendships.addresseeId, recipientId)
            ),
            and(
              eq(friendships.requesterId, recipientId),
              eq(friendships.addresseeId, senderId)
            )
          ),
          eq(friendships.status, 'accepted')
        ));

      if (friendship.length === 0) return null; // Not friends

      const [result] = await db.insert(playerMessages)
        .values({
          senderId,
          recipientId,
          message,
          isRead: false,
          createdAt: new Date()
        })
        .returning();

      const senderProfile = await this.getProfile(senderId);
      
      return {
        id: result.id,
        senderId: result.senderId,
        recipientId: result.recipientId,
        message: result.message,
        isRead: result.isRead || false,
        createdAt: result.createdAt!,
        senderProfile: senderProfile ?? undefined
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async getMessages(playerId: string, otherPlayerId: string, limit: number = 50): Promise<PlayerMessage[]> {
    try {
      const messages = await db.select().from(playerMessages)
        .where(or(
          and(
            eq(playerMessages.senderId, playerId),
            eq(playerMessages.recipientId, otherPlayerId)
          ),
          and(
            eq(playerMessages.senderId, otherPlayerId),
            eq(playerMessages.recipientId, playerId)
          )
        ))
        .orderBy(desc(playerMessages.createdAt))
        .limit(limit);

      const result: PlayerMessage[] = [];
      for (const message of messages.reverse()) {
        const senderProfile = await this.getProfile(message.senderId);
        result.push({
          id: message.id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          message: message.message,
          isRead: message.isRead || false,
          createdAt: message.createdAt!,
          senderProfile: senderProfile ?? undefined
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async markMessagesAsRead(recipientId: string, senderId: string): Promise<boolean> {
    try {
      await db.update(playerMessages)
        .set({ isRead: true })
        .where(and(
          eq(playerMessages.recipientId, recipientId),
          eq(playerMessages.senderId, senderId),
          eq(playerMessages.isRead, false)
        ));

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  async sendGameInvite(
    senderId: string,
    recipientId: string,
    gameMode: 'pvp' | 'pve' | 'tournament',
    category: string,
    difficulty: string,
    message?: string
  ): Promise<GameInvite | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire in 24 hours

      const [result] = await db.insert(gameInvites)
        .values({
          senderId,
          recipientId,
          gameMode,
          category,
          difficulty,
          message,
          status: 'pending',
          expiresAt,
          createdAt: new Date()
        })
        .returning();

      const senderProfile = await this.getProfile(senderId);

      return {
        id: result.id,
        senderId: result.senderId,
        recipientId: result.recipientId,
        gameMode: result.gameMode as 'pvp' | 'pve' | 'tournament',
        category: result.category,
        difficulty: result.difficulty,
        message: result.message || undefined,
        status: result.status as 'pending' | 'accepted' | 'declined' | 'expired',
        expiresAt: result.expiresAt ?? undefined,
        createdAt: result.createdAt!,
        senderProfile: senderProfile ?? undefined
      };
    } catch (error) {
      console.error('Error sending game invite:', error);
      return null;
    }
  }

  async respondToGameInvite(inviteId: number, response: 'accepted' | 'declined'): Promise<boolean> {
    try {
      await db.update(gameInvites)
        .set({ status: response })
        .where(eq(gameInvites.id, inviteId));

      return true;
    } catch (error) {
      console.error('Error responding to game invite:', error);
      return false;
    }
  }

  async getGameInvites(playerId: string): Promise<GameInvite[]> {
    try {
      const invites = await db.select().from(gameInvites)
        .where(and(
          eq(gameInvites.recipientId, playerId),
          eq(gameInvites.status, 'pending')
        ))
        .orderBy(desc(gameInvites.createdAt));

      const result: GameInvite[] = [];
      for (const invite of invites) {
        const senderProfile = await this.getProfile(invite.senderId);
        result.push({
          id: invite.id,
          senderId: invite.senderId,
          recipientId: invite.recipientId,
          gameMode: invite.gameMode as 'pvp' | 'pve' | 'tournament',
          category: invite.category,
          difficulty: invite.difficulty,
          message: invite.message || undefined,
          status: invite.status as 'pending' | 'accepted' | 'declined' | 'expired',
          expiresAt: invite.expiresAt ?? undefined,
          createdAt: invite.createdAt!,
          senderProfile: senderProfile ?? undefined
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting game invites:', error);
      return [];
    }
  }
}