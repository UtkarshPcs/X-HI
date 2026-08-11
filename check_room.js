import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: cert({
    projectId: 'balmy-nuance-472404-q9',
    clientEmail: 'firebase-adminsdk-fbsvc@balmy-nuance-472404-q9.iam.gserviceaccount.com',
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIpPjohfzZwAbf\nc6Agw0cSYaBtgLJPMvguafRiXmU/MMZgyI6U1if/Ru7GvOtOrE0y5rHxT5wkau4c\nhUaAOHjbej8m4fIEnL6xgaZw7ln08WnuAkKJ4yAWG4/9ENm3X573lIJSQg3vFVTS\nx8Jqpldx8+KDCpZk2dlVaVmNRgptpdxtwQ6kRjxxd+5lro6/QilQ2eJ1JmypwGF8\natG26R1UCUhdSjB4P8GJr7zz3GfmjqDRKlwKN779ePYqPiKAfLKmH1KH7ssFHeJp\nza8J7O5a5Sp5ET7DTC4CvsJZXvY/7/ldtU7T7vlcK1doJtNYNETB6RMoEx7f6k7I\n0/cdTnMBAgMBAAECggEAUWv5AksVP7wYTedbDNCR79ikRKucMF2LrzIaFS0fQxRk\n/HOGwMljM8myLf4OMz/imAxcG4Pl5jVqaTKAWJoSGWazZ/D6yHpfPCNTyrI+2RJ6\nnTZXkCMWK0KGHPkQkMSB+xBODll11BbA9ERSFftosvp4ahsKyuRIuMtmptjMdI/H\n8Lkzn/HqDfRQAOGogUZvcprNjAAxwaP00xwHl9jRvehc+CcIwIIsQVAswJ2zyTI8\nqYC291T/Ph3VMSXl9VqU/3FY7pkSkQV+ZmS7j0gXRmMK+aO63MteXM9fdyZZk2ue\naqaG3+84O0yIzeIWgw6vxirWvlOZxodA6X5g3aiD/QKBgQD/aIyro+EXjg3JkgUD\nJ30Z041/2dxOhc1uiJqk0ejnD2aoSZfKns0rqQDCzgiNpV9MrHjtkLsYSzSkjRis\nEK5rt3OC4jRXQsng+pzWnzdDFIoRcvwvbtfxXBHhe8AwN0eIuRN6NFfXHAf4etDS\nG1UMBuTSoXdqNcZxxj20dRMyuwKBgQDJG/L+refkbNbyCfIhV9hOJ0nwUg7zKZon\n0SlVQcpNK7GQ2n2DpVfvBx2O+bBFf1bB8ri5MyG9KXuHomkrhCPZATAf7XrBl8zr\n9cm+PnQI1WwOF4IHjojJYSthABA3krrE7LOav4wexUacMRV4Ham4/ySCWwTblKyT\nR0PF2QfrcwKBgCz4KIR0B0bRcSYDerRyeHlaoThYkIyWzHPgw3Gvr9U3Bfktc/dt\n/GvqhsLF6gWej2f9mhEiAX8mhq9OVIC/MyauFz19PH/8t3TQS1sSj3VVIXYvC64C\nUy0g69kKo+0ZXpP5Gi/TFYA/ZDvgy/GidFf4wsM/QLpHm5gesnCaiHXPAoGAUMHd\ncTHKderS4bzms0cAQFn8kfmRsUmacrTGQUs6/oQ2OLHURyIFTqHv17MierXo09cx\nIIWM3dYjmdK5ItVcQ877UUbezZC0pGg9zBxuIgH58yqzd29gNGXFsp0A5iAQyfU3\nJkQW82BKu3vmYCahOf2S3pnIOJjaOAYdC/zb9ksCgYEA5NMn+PeToQHDYXW2jn0u\nP6+2GcpEa59ETqMeyyJmdgSZw2k/WUex9ZBE10ZgNvGlnA5tz3wkhjeI5AYTsShD\nYXIiZmt3jOnUBeORdBoqCS4QH/Nu3nSKxB1bQPeiO3sfsM9mUz3jo60r76A0DQWH\n+I3vLLBwA07z+gAm/JWEt08=\n-----END PRIVATE KEY-----\n"
  })
});

const db = getFirestore();

async function check() {
  const roomsSnapshot = await db.collection('studyRooms').where('roomCode', '==', 'LFX5WT').get();
  if (roomsSnapshot.empty) {
    console.log("Room LFX5WT not found.");
    process.exit(0);
  }
  const roomDoc = roomsSnapshot.docs[0];
  const roomData = roomDoc.data();
  console.log("Room Data:", {
    id: roomDoc.id,
    mode: roomData.mode,
    isActive: roomData.isActive,
    askedQuestionIds: roomData.askedQuestionIds || []
  });

  const testSnapshot = await db.collection('starBatchTests').where('chapterId', '==', 'maths-0-c3').get();
  if (testSnapshot.empty) {
    console.log("Test for Quadratic Equations not found.");
  } else {
    const testDoc = testSnapshot.docs[0];
    const testData = testDoc.data();
    const questions = testData.questions || [];
    const undeletedQuestions = questions.filter(q => !q.isDeleted);
    console.log(`Total questions in Quadratic Equations bank: ${undeletedQuestions.length}`);
    
    // Group by difficulty
    const byDiff = {};
    undeletedQuestions.forEach(q => {
      const diff = q.difficulty || 'Medium';
      byDiff[diff] = (byDiff[diff] || 0) + 1;
    });
    console.log("Questions by difficulty:", byDiff);
    
    if (roomData.quizState) {
        console.log("Current Quiz Difficulty:", roomData.quizState.difficulty);
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
