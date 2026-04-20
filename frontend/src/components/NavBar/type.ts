export type NavbarPopover = 'menu' | 'notification' | null;

export type NavbarPopoverOpen = Exclude<NavbarPopover, null>;
