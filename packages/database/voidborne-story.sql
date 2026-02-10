-- VOIDBORNE: THE SILENT THRONE - Chapter 1

-- Insert the main story
INSERT INTO stories (id, title, description, genre, status, "currentChapter", "totalChapters", "authorId", "isAIGenerated", "totalReaders", "totalBets", "viewCount")
VALUES 
    ('story-voidborne', 
     'VOIDBORNE: The Silent Throne', 
     'The Covenant of Seven Houses stands on the brink of collapse. Someone has learned to Stitch new Threads—an art thought impossible. As heir to House Valdris, you must navigate deadly succession politics while the fabric of reality itself begins to fray. Five perspectives. Five agendas. One choice that could shatter the known universe.',
     'Space Political Sci-Fi',
     'ACTIVE',
     1,
     1,
     'user-1',
     true,
     0,
     0,
     0)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    genre = EXCLUDED.genre;

-- Insert Chapter 1
INSERT INTO chapters (
    id, 
    "storyId", 
    "chapterNumber", 
    title, 
    content, 
    summary, 
    status, 
    "publishedAt", 
    "wordCount", 
    "readTime", 
    "aiModel"
)
VALUES 
    ('chapter-voidborne-1',
     'story-voidborne',
     1,
     'The Blade-Court Summons',
     'The Thread-lights flicker in your peripheral vision as you descend into the Valdris Throne Vault. You''ve learned to ignore them—most people can''t see the Seams at all, but you were trained at the Loom. Threading comes as naturally as breathing now. Almost too naturally.

Your brother''s body was returned three days ago in a sealed casket. "Molecular degradation from improper stasis," the report claimed. You knew better. Someone had Frayed him from the inside out. The kind of precision kill that requires a master-class Weaver—or access to weapons-grade Binding technology.

The Blade-Peers are waiting when you reach the obsidian hall. Twelve of them, arranged in the ritual half-circle, each representing a different military or economic power bloc within Valdris. They shouldn''t be here. This is supposed to be a private mourning period.

Lord Cashen speaks first, his voice echoing off the vaulted ceiling: "Lady Sera. We convene under the Obligation of Blood. Your eldest brother is dead. Your middle brother has been declared traitor-in-exile. You are now First Heir to the Iron Throne."

You''ve been dreading this moment for three years. Ever since your second brother vanished into Solvane space and the whispers started that he''d defected. Or been taken. The distinction matters less each day he remains gone.

"You know the law," Cashen continues. "An heir cannot ascend without proving strength. You have thirty days to secure the loyalty of at least eight Blade-Peers—or challenge the strongest among us to ritual combat."

Political maneuvering or sanctioned murder. Those are your options.

Behind Cashen, you notice Lady Vren—master of the Valdris intelligence network—watching you with an expression you can''t quite parse. She knows something. They all do. This isn''t just about succession. Something deeper is happening.

A Thread-current shivers through the air. You''re the only one in the room who notices it. The Seam-density here is wrong. Someone has been Binding in the Throne Vault—recently. And they were careful to hide it.

You have thirty days. Thirty days to navigate Blade-Peer politics, figure out who killed your brother, and understand why the fabric of reality in your own family''s stronghold is showing signs of manipulation.

The first choice begins now.',
     'Sera Valdris, newly named First Heir to House Valdris after her brother''s assassination, must navigate deadly succession politics while uncovering a conspiracy involving forbidden Seam manipulation.',
     'PUBLISHED',
     NOW(),
     412,
     2,
     'Claude Sonnet 3.7');

-- Insert choices
INSERT INTO choices (
    id, 
    "chapterId", 
    "choiceNumber", 
    text, 
    description,
    "totalBets",
    "betCount"
)
VALUES 
    ('choice-voidborne-1-1',
     'chapter-voidborne-1',
     1,
     'Confront Lady Vren privately about the Thread-manipulation',
     'Use your Threading abilities to gather intelligence before playing politics. Risk: If Vren is compromised, you''ve revealed your awareness of the Seam-tampering. Reward: Hard intelligence about who''s working against you.',
     0,
     0),
    
    ('choice-voidborne-1-2',
     'chapter-voidborne-1',
     2,
     'Begin building a coalition among the younger Blade-Peers',
     'Play the political game the traditional way—promises, alliances, and calculated compromises. Risk: This is what everyone expects you to do, which means your opponents will be prepared. Reward: Predictable, methodical path to securing eight loyalties.',
     0,
     0),
    
    ('choice-voidborne-1-3',
     'chapter-voidborne-1',
     3,
     'Challenge Lord Cashen immediately to ritual combat',
     'Shock the court by declaring your intent to prove strength through the old way. Risk: Cashen is a veteran duelist with decades of experience. Reward: If you win, you bypass politics entirely and claim the throne through the ancient right of the blade.',
     0,
     0);

-- Create betting pool
INSERT INTO betting_pools (
    id,
    "chapterId",
    "betToken",
    "betTokenAddress",
    "minBet",
    "maxBet",
    "opensAt",
    "closesAt",
    status,
    "totalPool",
    "totalBets",
    "uniqueBettors",
    "contractAddress"
)
VALUES 
    ('pool-voidborne-1',
     'chapter-voidborne-1',
     'USDC',
     '0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132',
     10.00,
     10000.00,
     NOW(),
     NOW() + INTERVAL '7 days',
     'OPEN',
     0,
     0,
     0,
     '0xD4C57AC117670C8e1a8eDed3c05421d404488123');

SELECT 'VOIDBORNE story created successfully!' as message;
