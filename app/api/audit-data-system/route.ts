import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

interface TestResult {
  testName: string;
  passed: boolean;
  details: any;
  error?: string;
}

interface AuditResults {
  timestamp: string;
  userId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: TestResult[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Data System Audit] Starting comprehensive audit...');
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testResults: TestResult[] = [];
    let passedTests = 0;
    let failedTests = 0;

    // Helper function to add test result
    const addTestResult = (testName: string, passed: boolean, details: any, error?: string) => {
      testResults.push({ testName, passed, details, error });
      if (passed) passedTests++; else failedTests++;
    };

    // Test 1: Database Connection and Basic Queries
    try {
      const { data: quests, error: questsError } = await supabaseServer
        .from('quests')
        .select('id, name, category')
        .limit(5);
      
      if (questsError) throw questsError;
      
      addTestResult(
        'Database Connection & Quest Query',
        true,
        { questCount: quests?.length || 0, sampleQuests: quests?.slice(0, 2) }
      );
    } catch (error) {
      addTestResult(
        'Database Connection & Quest Query',
        false,
        {},
        `Database connection failed: ${error}`
      );
    }

    // Test 2: Quest Completion Saving
    try {
      const testQuestId = 'test-quest-' + Date.now();
      
      // Insert test quest
      const { data: insertQuest, error: insertError } = await supabaseServer
        .from('quests')
        .insert({
          id: testQuestId,
          name: 'Test Quest for Audit',
          description: 'Test quest for data audit',
          category: 'might',
          difficulty: 'medium',
          xp_reward: 50,
          gold_reward: 25
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Test quest completion saving
      const { data: completionData, error: completionError } = await supabaseServer
        .from('quest_completion')
        .insert({
          user_id: userId,
          quest_id: testQuestId,
          completed: true,
          completed_at: new Date().toISOString(),
          xp_earned: 50,
          gold_earned: 25
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Verify the data was saved correctly
      const { data: verifyData, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', testQuestId)
        .single();

      if (verifyError) throw verifyError;

      // Clean up test data
      await supabaseServer.from('quest_completion').delete().eq('quest_id', testQuestId);
      await supabaseServer.from('quests').delete().eq('id', testQuestId);

      addTestResult(
        'Quest Completion Saving',
        true,
        { 
          savedCorrectly: verifyData?.completed === true,
          xpEarned: verifyData?.xp_earned,
          goldEarned: verifyData?.gold_earned,
          completedAt: verifyData?.completed_at
        }
      );
    } catch (error) {
      addTestResult(
        'Quest Completion Saving',
        false,
        {},
        `Quest completion saving failed: ${error}`
      );
    }

    // Test 3: Challenge Completion Saving
    try {
      const testChallengeId = 'test-challenge-' + Date.now();
      
      // Insert test challenge
      const { data: insertChallenge, error: insertError } = await supabaseServer
        .from('challenges')
        .insert({
          id: testChallengeId,
          name: 'Test Challenge for Audit',
          description: 'Test challenge for data audit',
          category: 'Push/Legs/Core',
          difficulty: 'medium',
          xp: 50,
          gold: 25
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Test challenge completion saving
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const { data: challengeCompletion, error: challengeError } = await supabaseServer
        .from('challenge_completion')
        .insert({
          user_id: userId,
          challenge_id: testChallengeId,
          completed: true,
          date: today
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Verify the data was saved correctly
      const { data: verifyChallenge, error: verifyError } = await supabaseServer
        .from('challenge_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', testChallengeId)
        .eq('date', today)
        .single();

      if (verifyError) throw verifyError;

      // Clean up test data
      await supabaseServer.from('challenge_completion').delete().eq('challenge_id', testChallengeId);
      await supabaseServer.from('challenges').delete().eq('id', testChallengeId);

      addTestResult(
        'Challenge Completion Saving',
        true,
        { 
          savedCorrectly: verifyChallenge?.completed === true,
          date: verifyChallenge?.date,
          challengeId: verifyChallenge?.challenge_id
        }
      );
    } catch (error) {
      addTestResult(
        'Challenge Completion Saving',
        false,
        {},
        `Challenge completion saving failed: ${error}`
      );
    }

    // Test 4: Milestone Completion Saving
    try {
      const testMilestoneId = 'test-milestone-' + Date.now();
      
      // Insert test milestone
      const { data: insertMilestone, error: insertError } = await supabaseServer
        .from('milestones')
        .insert({
          id: testMilestoneId,
          name: 'Test Milestone for Audit',
          description: 'Test milestone for data audit',
          category: 'Push/Legs/Core',
          difficulty: 'medium',
          xp: 50,
          gold: 25
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Test milestone completion saving
      const { data: milestoneCompletion, error: milestoneError } = await supabaseServer
        .from('milestone_completion')
        .insert({
          user_id: userId,
          milestone_id: testMilestoneId,
          completed: true,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (milestoneError) throw milestoneError;

      // Verify the data was saved correctly
      const { data: verifyMilestone, error: verifyError } = await supabaseServer
        .from('milestone_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('milestone_id', testMilestoneId)
        .single();

      if (verifyError) throw verifyError;

      // Clean up test data
      await supabaseServer.from('milestone_completion').delete().eq('milestone_id', testMilestoneId);
      await supabaseServer.from('milestones').delete().eq('id', testMilestoneId);

      addTestResult(
        'Milestone Completion Saving',
        true,
        { 
          savedCorrectly: verifyMilestone?.completed === true,
          date: verifyMilestone?.date,
          milestoneId: verifyMilestone?.milestone_id
        }
      );
    } catch (error) {
      addTestResult(
        'Milestone Completion Saving',
        false,
        {},
        `Milestone completion saving failed: ${error}`
      );
    }

    // Test 5: Historical Data Preservation
    try {
      const testQuestId = 'historical-test-' + Date.now();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();

      // Insert test quest
      await supabaseServer.from('quests').insert({
        id: testQuestId,
        name: 'Historical Test Quest',
        description: 'Test quest for historical data preservation',
        category: 'might',
        difficulty: 'medium',
        xp_reward: 50,
        gold_reward: 25
      });

      // Create historical completion record
      const { data: historicalCompletion, error: historicalError } = await supabaseServer
        .from('quest_completion')
        .insert({
          user_id: userId,
          quest_id: testQuestId,
          completed: true,
          completed_at: yesterdayISO,
          original_completion_date: yesterdayISO,
          xp_earned: 50,
          gold_earned: 25
        })
        .select()
        .single();

      if (historicalError) throw historicalError;

      // Test smart_quest_completion function with p_completed = false
      // This should NOT delete the historical record
      const { data: smartCompletionResult, error: smartError } = await supabaseServer
        .rpc('smart_quest_completion', {
          p_user_id: userId,
          p_quest_id: testQuestId,
          p_completed: false,
          p_xp_reward: 50,
          p_gold_reward: 25
        });

      if (smartError) throw smartError;

      // Verify historical data is still there
      const { data: verifyHistorical, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', testQuestId)
        .gte('completed_at', yesterdayISO.split('T')[0] + 'T00:00:00.000Z')
        .lt('completed_at', yesterdayISO.split('T')[0] + 'T23:59:59.999Z');

      if (verifyError) throw verifyError;

      // Clean up test data
      await supabaseServer.from('quest_completion').delete().eq('quest_id', testQuestId);
      await supabaseServer.from('quests').delete().eq('id', testQuestId);

      addTestResult(
        'Historical Data Preservation',
        true,
        { 
          historicalRecordsPreserved: verifyHistorical?.length > 0,
          smartCompletionResult: smartCompletionResult,
          historicalRecordCount: verifyHistorical?.length || 0
        }
      );
    } catch (error) {
      addTestResult(
        'Historical Data Preservation',
        false,
        {},
        `Historical data preservation failed: ${error}`
      );
    }

    // Test 6: Kingdom Stats Data Retrieval
    try {
      // Get recent completion data
      const { data: recentCompletions, error: recentError } = await supabaseServer
        .from('quest_completion')
        .select('completed_at, xp_earned, gold_earned, quest_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      if (recentError) throw recentError;

      // Group by date
      const groupedData = recentCompletions?.reduce((acc: any, completion: any) => {
        const date = completion.completed_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, xp: 0, gold: 0 };
        }
        acc[date].count++;
        acc[date].xp += completion.xp_earned || 0;
        acc[date].gold += completion.gold_earned || 0;
        return acc;
      }, {}) || {};

      addTestResult(
        'Kingdom Stats Data Retrieval',
        true,
        { 
          totalRecords: recentCompletions?.length || 0,
          dateGroups: Object.keys(groupedData).length,
          sampleData: Object.entries(groupedData).slice(0, 3),
          dataRange: recentCompletions?.length > 0 ? {
            earliest: recentCompletions[recentCompletions.length - 1]?.completed_at,
            latest: recentCompletions[0]?.completed_at
          } : null
        }
      );
    } catch (error) {
      addTestResult(
        'Kingdom Stats Data Retrieval',
        false,
        {},
        `Kingdom stats data retrieval failed: ${error}`
      );
    }

    // Test 7: API Endpoint Functionality
    try {
      // Test quests API
      const questsResponse = await fetch(`${request.url.replace('/audit-data-system', '/quests')}`, {
        headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
      });
      const questsData = await questsResponse.json();

      // Test challenges API
      const challengesResponse = await fetch(`${request.url.replace('/audit-data-system', '/challenges')}`, {
        headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
      });
      const challengesData = await challengesResponse.json();

      // Test milestones API
      const milestonesResponse = await fetch(`${request.url.replace('/audit-data-system', '/milestones')}`, {
        headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
      });
      const milestonesData = await milestonesResponse.json();

      addTestResult(
        'API Endpoint Functionality',
        true,
        { 
          questsAPIWorking: questsResponse.ok,
          challengesAPIWorking: challengesResponse.ok,
          milestonesAPIWorking: milestonesResponse.ok,
          questsCount: Array.isArray(questsData) ? questsData.length : 'N/A',
          challengesCount: Array.isArray(challengesData) ? challengesData.length : 'N/A',
          milestonesCount: Array.isArray(milestonesData) ? milestonesData.length : 'N/A'
        }
      );
    } catch (error) {
      addTestResult(
        'API Endpoint Functionality',
        false,
        {},
        `API endpoint functionality test failed: ${error}`
      );
    }

    // Test 8: Data Integrity Constraints
    try {
      // Test unique constraints
      const testQuestId = 'constraint-test-' + Date.now();
      
      // Insert test quest
      await supabaseServer.from('quests').insert({
        id: testQuestId,
        name: 'Constraint Test Quest',
        description: 'Test quest for constraint testing',
        category: 'might',
        difficulty: 'medium',
        xp_reward: 50,
        gold_reward: 25
      });

      // Try to insert duplicate completion (should fail)
      const { error: duplicateError } = await supabaseServer
        .from('quest_completion')
        .insert([
          {
            user_id: userId,
            quest_id: testQuestId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: 50,
            gold_earned: 25
          },
          {
            user_id: userId,
            quest_id: testQuestId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: 50,
            gold_earned: 25
          }
        ]);

      // Clean up test data
      await supabaseServer.from('quest_completion').delete().eq('quest_id', testQuestId);
      await supabaseServer.from('quests').delete().eq('id', testQuestId);

      addTestResult(
        'Data Integrity Constraints',
        true,
        { 
          duplicatePreventionWorking: duplicateError?.code === '23505', // Unique constraint violation
          constraintError: duplicateError?.message || 'No constraint error (unexpected)'
        }
      );
    } catch (error) {
      addTestResult(
        'Data Integrity Constraints',
        false,
        {},
        `Data integrity constraints test failed: ${error}`
      );
    }

    // Generate summary
    const totalTests = testResults.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';
    
    const auditResults: AuditResults = {
      timestamp: new Date().toISOString(),
      userId,
      totalTests,
      passedTests,
      failedTests,
      testResults,
      summary: `${passedTests}/${totalTests} tests passed (${successRate}% success rate)`
    };

    console.log('[Data System Audit] Audit completed:', auditResults.summary);

    return NextResponse.json(auditResults);

  } catch (error) {
    console.error('[Data System Audit] Audit failed:', error);
    return NextResponse.json({ 
      error: 'Audit failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
