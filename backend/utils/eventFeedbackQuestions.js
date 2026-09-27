function eventFeedbackQuestions(event) {
  const eventName = event.title;
  if ((event.tags || []).includes('Jasmine Sandlas')) {
    return [
      { text: 'How would you rate Jasmine Sandlas’s live performance overall?', type: 'rating', required: true },
      { text: 'How would you rate the live vocals and musical performance?', type: 'rating', required: true },
      { text: 'How would you rate the stage presence and audience engagement?', type: 'rating', required: true },
      { text: 'How would you rate the sound, lighting, and stage production?', type: 'rating', required: true },
      { text: 'How would you rate the event organisation and crowd experience?', type: 'rating', required: true },
      { text: 'Which part of the performance did you enjoy most?', type: 'choice', options: ['Live vocals', 'Setlist', 'Stage presence', 'Audience interaction', 'Stage production', 'Other'], required: true },
      { text: 'What was your favorite moment from Jasmine Sandlas’s performance?', type: 'open_text', required: true },
      { text: 'Which song or musical moment would you like to hear again?', type: 'open_text', required: false },
      { text: 'How likely are you to recommend this live performance to a friend?', type: 'nps', required: true },
      { text: 'Would you attend another Koshish live concert?', type: 'choice', options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], required: true },
    ];
  }

  const activityOptions = [...new Set([
    ...(event.tags || []).map((tag) => tag.replace(/[_-]/g, ' ')),
    'Activities and sessions',
    'Stage and performances',
    'Organisation',
    'Other',
  ])].slice(0, 8);

  return [
    { text: `How would you rate your overall experience at ${eventName}?`, type: 'rating', required: true },
    { text: `How engaging were the activities and sessions at ${eventName}?`, type: 'rating', required: true },
    { text: `How well did ${eventName} match your expectations?`, type: 'rating', required: true },
    { text: `How would you rate the organisation and timing of ${eventName}?`, type: 'rating', required: true },
    { text: `How would you rate the venue and facilities for ${eventName}?`, type: 'rating', required: true },
    { text: `Which part of ${eventName} did you enjoy most?`, type: 'choice', options: activityOptions, required: true },
    { text: `What was the highlight of your experience at ${eventName}?`, type: 'open_text', required: true },
    { text: `What is one thing we could improve for the next ${eventName}?`, type: 'open_text', required: false },
    { text: `How likely are you to recommend ${eventName} to a friend?`, type: 'nps', required: true },
    { text: `Would you attend ${eventName} again?`, type: 'choice', options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], required: true },
  ];
}

module.exports = eventFeedbackQuestions;
