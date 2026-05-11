export const canEdit = isOwner && hasWriteScope;

export let display = label;
display &&= label.toUpperCase();
