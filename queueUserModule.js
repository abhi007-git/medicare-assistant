import { initFirebase, enqueuePatient, subscribeQueue, getCurrentServing } from "./queueStoreFirestore.js";

const SESSION_KEY = "queuePatientId";

function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function initQueueUserModule({
  firebaseConfig,
  tokenNumberEl,
  waitTimeEl,
  currentServingEl,
  emergencyBadgeEl,
  statusTextEl
}) {
  initFirebase(firebaseConfig);

  let myPatientId = sessionStorage.getItem(SESSION_KEY) || null;
  let currentPatient = null;
  let previousPosition = -1;
  let previousConsultingToken = null;
  let hasAnnouncedTurn = false;
  let lastEmergencyCount = 0;
  let lastQueue = [];

  async function ensureMyPatient(queue) {
    if (myPatientId) {
      const found = queue.find(([id]) => id === myPatientId);
      if (found) return;
      myPatientId = null;
      currentPatient = null;
      sessionStorage.removeItem(SESSION_KEY);
    }

    const randomName = "Patient-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const created = await enqueuePatient(randomName, "General checkup", false);
    myPatientId = created.patientId;
    sessionStorage.setItem(SESSION_KEY, myPatientId);
    speak(`Welcome! Your token number is ${created.token}. Please wait for your turn.`);
  }

  function getTokensAhead(queue) {
    const waitingQueue = queue.filter(([, p]) => p.status === "waiting");
    const myIndex = waitingQueue.findIndex(([id]) => id === myPatientId);
    return myIndex >= 0 ? myIndex : 0;
  }

  function updateView(queue) {
    lastQueue = queue;
    if (!queue.length || !myPatientId) {
      tokenNumberEl.textContent = "---";
      waitTimeEl.textContent = "No patients in queue";
      currentServingEl.textContent = "--";
      if (emergencyBadgeEl) emergencyBadgeEl.style.display = "none";
      return;
    }

    const myEntry = queue.find(([id]) => id === myPatientId);
    currentPatient = myEntry ? myEntry[1] : null;

    if (!currentPatient) return;

    const tokensAhead = getTokensAhead(queue);
    tokenNumberEl.textContent = currentPatient.token;

    const consultingPatient = getCurrentServing(queue);
    currentServingEl.textContent = consultingPatient ? consultingPatient[1].token : "--";

    if (emergencyBadgeEl) {
      emergencyBadgeEl.style.display = currentPatient.emergency ? "flex" : "none";
    }

    if (currentPatient.status === "consulting") {
      waitTimeEl.textContent = "Your turn - Currently consulting";
      if (previousConsultingToken !== currentPatient.token) {
        previousConsultingToken = currentPatient.token;
        setTimeout(() => speak(`Token number ${currentPatient.token}, please proceed to the consultation room now.`), 400);
      }
    } else if (currentPatient.emergency) {
      waitTimeEl.textContent = "EMERGENCY - Immediate";
    } else {
      const estimatedMinutes = tokensAhead * 5;
      waitTimeEl.textContent = tokensAhead === 0
        ? "Next in line - Please be ready"
        : `${tokensAhead} patient${tokensAhead > 1 ? "s" : ""} ahead ~ ${estimatedMinutes} min`;
    }

    if (tokensAhead === 0 && currentPatient.status === "waiting" && previousPosition > 0 && !hasAnnouncedTurn) {
      setTimeout(() => speak(`Attention! Token number ${currentPatient.token}, you are next in line. Please be ready.`), 800);
      hasAnnouncedTurn = true;
    } else if (tokensAhead > 0) {
      hasAnnouncedTurn = false;
    }

    const emergencyCount = queue.filter(([, p]) => p.emergency && p.status === "waiting").length;
    if (emergencyCount > lastEmergencyCount && !currentPatient.emergency) {
      setTimeout(() => speak("Attention! An emergency case has been added to the queue. Please stay nearby."), 1200);
    }
    lastEmergencyCount = emergencyCount;

    previousPosition = tokensAhead;
    if (statusTextEl) statusTextEl.textContent = "Live updates active";
  }

  function buildStatusMessage() {
    if (!currentPatient) return "No token found. Please register at the reception.";

    const tokensAhead = getTokensAhead(lastQueue);
    let message = `Your token number is ${currentPatient.token}. `;

    if (currentPatient.emergency) {
      message += "This is an emergency case. You will be called immediately.";
    } else if (currentPatient.status === "consulting") {
      message += "It is your turn now. Please proceed to the doctor.";
    } else if (tokensAhead === 0) {
      message += "You are next in line. Please be ready.";
    } else {
      message += `There ${tokensAhead === 1 ? "is" : "are"} ${tokensAhead} patient${tokensAhead > 1 ? "s" : ""} ahead. Estimated wait time ${tokensAhead * 5} minutes.`;
    }

    return message;
  }

  function handleVoiceCommand(command) {
    const lower = command.toLowerCase();
    if (lower.includes("status") || lower.includes("hello")) {
      speak(buildStatusMessage());
    } else if (lower.includes("token") || lower.includes("number")) {
      speak(currentPatient ? `Your token number is ${currentPatient.token}.` : "No token assigned yet.");
    } else if (lower.includes("position") || lower.includes("queue")) {
      const tokensAhead = getTokensAhead(lastQueue);
      const msg = currentPatient
        ? tokensAhead === 0
          ? "You are next in line. Please proceed."
          : `There ${tokensAhead === 1 ? "is" : "are"} ${tokensAhead} patient${tokensAhead > 1 ? "s" : ""} ahead of you.`
        : "You are not in the queue.";
      speak(msg);
    } else if (lower.includes("wait")) {
      const tokensAhead = getTokensAhead(lastQueue);
      const msg = currentPatient
        ? currentPatient.emergency
          ? "Your case is marked as emergency. You will be called immediately."
          : tokensAhead === 0
            ? "Your turn is now. Please proceed."
            : `Estimated wait time is ${tokensAhead * 5} minutes.`
        : "No wait time information available.";
      speak(msg);
    }
  }

  const unsubscribe = subscribeQueue(async (queue) => {
    await ensureMyPatient(queue);
    updateView(queue);
  });

  return {
    handleVoiceCommand,
    speakStatus: () => speak(buildStatusMessage()),
    resetToken: () => {
      myPatientId = null;
      currentPatient = null;
      sessionStorage.removeItem(SESSION_KEY);
    },
    unsubscribe,
  };
}
