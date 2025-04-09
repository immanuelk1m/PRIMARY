const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-background p-4 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} PRIMARY Platform. All rights reserved.
    </footer>
  );
};

export default Footer;