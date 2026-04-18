export type NavbarPopover = 'menu' | 'notification' | 'language' | null;

export type NavbarPopoverOpen = Exclude<NavbarPopover, null>;
