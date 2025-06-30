// Test script to verify mastered functionality
import { flashcardService } from './src/services/flashcardService.js';

const userId = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

async function testMasteredFunctionality() {
  try {
    console.log('🧪 Testing Mastered Functionality');
    console.log('==================================');

    // 1. Get current flashcard sets
    console.log('\n1️⃣ Fetching current flashcard sets...');
    const sets = await flashcardService.getUserFlashcardSets(userId);
    console.log(`Found ${sets.length} flashcard sets`);

    if (sets.length === 0) {
      console.log('❌ No flashcard sets found. Please create some sets first.');
      return;
    }

    // 2. Find a set with flashcards to test mastery
    const setWithCards = sets.find(set => set.flashcards.length > 0);
    if (!setWithCards) {
      console.log('❌ No sets with flashcards found. Please add some flashcards first.');
      return;
    }

    console.log(`\n2️⃣ Testing mastery on set: "${setWithCards.name}"`);
    console.log(`Set has ${setWithCards.flashcards.length} flashcards`);

    // 3. Show current mastery status
    console.log('\n3️⃣ Current mastery status:');
    setWithCards.flashcards.forEach((card, index) => {
      console.log(`   Card ${index + 1}: ${card.mastered ? '✅ Mastered' : '❌ Not Mastered'} - "${card.question.substring(0, 50)}..."`);
    });

    // 4. Test updating mastery status
    const testCard = setWithCards.flashcards[0];
    const originalMastered = testCard.mastered;
    const newMastered = !originalMastered;

    console.log(`\n4️⃣ Testing mastery update on first card:`);
    console.log(`   Original mastered status: ${originalMastered}`);
    console.log(`   Setting mastered to: ${newMastered}`);

    // Update the mastery status
    const updatedCard = await flashcardService.updateFlashcard(
      userId,
      testCard.id,
      undefined, // question
      undefined, // answer
      newMastered // mastered
    );

    console.log(`   ✅ Update successful! New mastered status: ${updatedCard.mastered}`);

    // 5. Verify the change persisted by refetching the set
    console.log('\n5️⃣ Verifying persistence by refetching data...');
    const updatedSet = await flashcardService.getFlashcardSetById(userId, setWithCards.id);
    const refetchedCard = updatedSet.flashcards.find(card => card.id === testCard.id);

    if (refetchedCard.mastered === newMastered) {
      console.log(`   ✅ Verification successful! Mastered status persisted: ${refetchedCard.mastered}`);
    } else {
      console.log(`   ❌ Verification failed! Expected ${newMastered}, got ${refetchedCard.mastered}`);
    }

    // 6. Test finding first unmarked card
    console.log('\n6️⃣ Testing first unmarked card logic...');
    const unmarkedIndex = updatedSet.flashcards.findIndex(card => !card.mastered);
    console.log(`   First unmarked card index: ${unmarkedIndex >= 0 ? unmarkedIndex : 'All cards are mastered!'}`);

    // 7. Restore original state
    console.log('\n7️⃣ Restoring original mastery state...');
    await flashcardService.updateFlashcard(
      userId,
      testCard.id,
      undefined,
      undefined,
      originalMastered
    );
    console.log('   ✅ Original state restored');

    console.log('\n🎉 Mastered functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testMasteredFunctionality(); 